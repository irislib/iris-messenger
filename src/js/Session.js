import Gun from 'gun';
import State from './State';
import Notifications from './Notifications';
import Helpers from './Helpers';
import PeerManager from './PeerManager';
import { route } from 'preact-router';
import iris from './iris-lib';
import _ from 'lodash';
import Fuse from "./lib/fuse.basic.esm.min";
import localforage from './lib/localforage.min';
import { ec as EC } from 'elliptic';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let ourActivity;
let noFollows;
let noFollowers;
let userSearchIndex;
const contacts = {};
const channels = window.channels = {};

const DEFAULT_SETTINGS = {
  electron: {
    openAtLogin: true,
    minimizeOnClose: true
  },
  local: {
    enableWebtorrent: !iris.util.isMobile,
    enablePublicPeerDiscovery: true,
    autoplayWebtorrent: true,
    maxConnectedPeers: Helpers.isElectron ? 3 : 2
  }
}

const updateUserSearchIndex = _.throttle(() => {
  const options = {keys: ['name'], includeScore: true, includeMatches: true, threshold: 0.3};
  const values = Object.values(_.omit(contacts, Object.keys(State.getBlockedUsers())));
  userSearchIndex = new Fuse(values, options);
}, 3000, {leading:true});

function addFollow(callback, k, followDistance, follower) {
  if (contacts[k]) {
    if (contacts[k].followDistance > followDistance) {
      contacts[k].followDistance = followDistance;
    }
    contacts[k].followers.add(follower);
  } else {
    contacts[k] = {key: k, followDistance, followers: new Set(follower && [follower])};
    State.public.user(k).get('profile').get('name').on(name => {
      contacts[k].name = name;
      State.local.get('contacts').get(k).get('name').put(name);
      callback && callback(k, contacts[k]);
    });
  }
  State.local.get('contacts').get(k).put({followDistance: contacts[k].followDistance,followerCount: contacts[k].followers.size});
  callback && callback(k, contacts[k]);
  updateUserSearchIndex();
  updateNoFollows();
  updateNoFollowers();
}

function removeFollow(k, followDistance, follower) {
  if (contacts[k]) {
    contacts[k].followers.delete(follower);
    if (followDistance === 1) {
      State.local.get('groups').get('follows').get(k).put(false);
    }
    updateNoFollows();
    updateNoFollowers();
  }
}

// TODO: this is still a performance issue. With throttle, follower graph / counts are not correctly updated
// without throttle, it hogs memory and cpu
const getExtendedFollows = _.throttle((callback, k, maxDepth = 3, currentDepth = 1) => {
  k = k || key.pub;

  addFollow(callback, k, currentDepth - 1);

  State.public.user(k).get('follow').map().on((isFollowing, followedKey) => { // TODO: unfollow
    if (isFollowing) {
      addFollow(callback, followedKey, currentDepth, k);
      if (currentDepth < maxDepth) {
        _.defer(() => getExtendedFollows(callback, followedKey, maxDepth, currentDepth + 1));
      }
    } else {
      removeFollow(followedKey, currentDepth, k);
    }
  });

  return contacts;
}, 2000);

const updateNoFollows = _.debounce(() => {
  const v = Object.keys(contacts).length <= 1;
  if (v !== noFollows) {
    noFollows = v;
    State.local.get('noFollows').put(noFollows);
  }
}, 1000);

const updateNoFollowers = _.debounce(() => {
  const v = !(contacts[key.pub] && (contacts[key.pub].followers.size > 0));
  if (v !== noFollowers) {
    noFollowers = v;
    State.local.get('noFollowers').put(noFollowers);
  }
}, 1000);

function getUserSearchIndex() {
  return userSearchIndex;
}

function setOurOnlineStatus() {
  const activeRoute = window.location.hash;
  iris.Channel.setActivity(State.public, ourActivity = 'active');
  const setActive = _.debounce(() => {
    const chat = activeRoute && channels[activeRoute.replace('#/profile/','').replace('#/chat/','')];
    if (chat && !ourActivity) {
      chat.setMyMsgsLastSeenTime();
    }
    iris.Channel.setActivity(State.public, ourActivity = 'active');
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setActivity(State.public, ourActivity = 'online'), 30000);
  }, 1000);
  document.addEventListener("touchmove", setActive);
  document.addEventListener("mousemove", setActive);
  document.addEventListener("keypress", setActive);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setActivity(State.public, ourActivity = 'active');
      const chatId = location.pathname.slice(1).replace('chat/','');
      const chat = activeRoute && channels[chatId];
      if (chat) {
        chat.setMyMsgsLastSeenTime();
        Notifications.changeChatUnseenCount(chatId, 0);
      }
    } else {
      iris.Channel.setActivity(State.public, ourActivity = 'online');
    }
  });
  setActive();
  window.addEventListener("beforeunload", () => {
    iris.Channel.setActivity(State.public, ourActivity = null);
  });
}

function updateGroups() {
  getExtendedFollows((k, info) => {
    if (info.followDistance <= 1) {
      State.local.get('groups').get('follows').get(k).put(true);
    } else if (info.followDistance == 2) {
      State.local.get('groups').get('2ndDegreeFollows').get(k).put(true);
    }
    State.local.get('groups').get('everyone').get(k).put(true);
    if (k === getPubKey()) {
      updateNoFollowers();
    }
  });
}

const isHex = (maybeHex) =>
  maybeHex.length !== 0 && maybeHex.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(maybeHex);

const hexToUint8Array = (hexString) => {
  if (!isHex(hexString)) {
    throw new Error('Not a hex string');
  }
  return Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function arrayToBase64Url(array) {
  return btoa(String.fromCharCode.apply(null, array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function keyPairFromHash(hash) {
  const ec = new EC('p256');
  const keyPair = ec.keyFromPrivate(new Uint8Array(hash));

  let privKey = keyPair.getPrivate().toArray("be", 32);
  let x = keyPair.getPublic().getX().toArray("be", 32);
  let y = keyPair.getPublic().getY().toArray("be", 32);

  privKey = arrayToBase64Url(privKey);
  x = arrayToBase64Url(x);
  y = arrayToBase64Url(y);

  const kp = { pub: `${x}.${y}`, priv: privKey };
  return kp;
}

async function ethereumLogin() {
  const accounts = await window.ethereum.request({method: 'eth_accounts'});
  if (accounts.length > 0) {
    const message = "I'm trusting this application with an irrevocable access key to my Iris account.";
    const signature = await window.ethereum.request({method: 'personal_sign', params: [accounts[0], message]});
    const signatureBytes = hexToUint8Array(signature.substring(2));
    const hash1 = await window.crypto.subtle.digest('SHA-256', signatureBytes);
    const hash2 = await window.crypto.subtle.digest('SHA-256', hash1);
    const signingKey = keyPairFromHash(hash1);
    const encryptionKey = keyPairFromHash(hash2);
    const k = {
      pub: signingKey.pub,
      priv: signingKey.priv,
      epub: encryptionKey.pub,
      epriv: encryptionKey.priv
    };
    login(k);
  }
}

function login(k) {
  const shouldRefresh = !!key;
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  iris.Channel.initUser(State.public, key);
  Notifications.subscribeToWebPush();
  Notifications.getWebPushSubscriptions();
  Notifications.subscribeToIrisNotifications();
  iris.Channel.getMyChatLinks(State.public, key, undefined, chatLink => {
    State.local.get('chatLinks').get(chatLink.id).put(chatLink.url);
    latestChatLink = chatLink.url;
  });
  setOurOnlineStatus();
  iris.Channel.getChannels(State.public, key, addChannel);
  let chatId = Helpers.getUrlParameter('chatWith') || Helpers.getUrlParameter('channelId');
  let inviter = Helpers.getUrlParameter('inviter');
  function go() {
    if (inviter !== key.pub) {
      newChannel(chatId, window.location.href);
    }
    _.defer(() => route(`/chat/${  chatId}`)); // defer because router is only initialised after login
    window.history.pushState({}, "Iris Chat", `/${window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]}`); // remove param
  }
  if (chatId) {
    if (inviter) {
      setTimeout(go, 2000); // wait a sec to not re-create the same chat
    } else {
      go();
    }
  }
  State.public.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      myName = name;
    }
  });
  State.public.user().get('profile').get('photo').on(data => {
    myProfilePhoto = data;
  });
  Notifications.init();
  State.local.get('loggedIn').put(true);
  State.local.get('settings').once().then(settings => {
    if (!settings) {
      State.local.get('settings').put(DEFAULT_SETTINGS.local)
    }
  });
  State.public.user().get('block').map().on((isBlocked, user) => {
    State.local.get('block').get(user).put(isBlocked);
    if (isBlocked) {
      delete contacts[user];
    }
  });
  updateGroups();
  if (shouldRefresh) {
    location.reload();
  }
  if (State.electron) {
    State.electron.get('settings').on(electron => {
      State.local.get('settings').get('electron').put(electron);
      if (electron.publicIp) {
        Object.values(channels).forEach(shareMyPeerUrl);
      }
    });
    State.electron.get('user').put(key.pub);
  }
  State.local.get('filters').get('group').once().then(v => {
    if (!v) {
      State.local.get('filters').get('group').put('follows');
    }
  });
}

async function createChatLink() {
  latestChatLink = await iris.Channel.createChatLink(State.public, key);
}

function clearIndexedDB() {
  return new Promise(resolve => {
    const r1 = window.indexedDB.deleteDatabase('State.local');
    const r2 = window.indexedDB.deleteDatabase('radata');
    let r1done;
    let r2done;
    const check = () => {
      r1done && r2done && resolve();
    }
    r1.onerror = r2.onerror = e => console.error(e);
    //r1.onblocked = r2.onblocked = e => console.error('blocked', e);
    r1.onsuccess = () => {
      r1done = true;
      check();
    }
    r2.onsuccess = () => {
      r2done = true;
      check();
    }
  });
}

function getMyChatLink() {
  return latestChatLink || Helpers.getProfileLink(key.pub);
}

function getKey() { return key; }
function getMyName() { return myName; }
function getMyProfilePhoto() { return myProfilePhoto; }

async function logOut() {
  route('/');
  if (State.electron) {
    State.electron.get('user').put(null);
  }
  // TODO: remove subscription from your channels
  if (navigator.serviceWorker) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.pushManager) {
      reg.active.postMessage({key: null});
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const hash = await iris.util.getHash(JSON.stringify(sub));
        Notifications.removeSubscription(hash);
        sub.unsubscribe && sub.unsubscribe();
      }
    }
  }
  clearIndexedDB();
  localStorage.clear();
  localforage.clear().then(() => {
    location.reload();
  });
}

function getPubKey() {
  return key && key.pub;
}

function loginAsNewUser(name) {
  name = name || Helpers.generateName();
  console.log('loginAsNewUser name', name);
  return Gun.SEA.pair().then(k => {
    login(k);
    State.public.user().get('profile').put({a:null});
    State.public.user().get('profile').get('name').put(name);
    State.local.get('filters').put({a:null});
    State.local.get('filters').get('group').put('follows');
    createChatLink();
  });
}

function init(options = {}) {
  let localStorageKey = localStorage.getItem('chatKeyPair');
  if (localStorageKey) {
    login(JSON.parse(localStorageKey));
  } else if (options.autologin) {
    loginAsNewUser();
  } else {
    clearIndexedDB();
  }
  setTimeout(() => {
    State.local.get('block').map(() => {
      updateUserSearchIndex();
    });
    updateUserSearchIndex();
  });
}

const myPeerUrl = ip => `http://${ip}:8767/gun`;

async function shareMyPeerUrl(channel) {
  const myIp = await State.local.get('settings').get('electron').get('publicIp').once();
  myIp && channel.put && channel.put('my_peer', myPeerUrl(myIp));
}

function newChannel(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(channels, pub)) {
    return;
  }
  const chat = new iris.Channel({gun: State.public, key, chatLink, participants: pub});
  addChannel(chat);
  return chat;
}

function addChannel(chat) {
  let pub = chat.getId();
  if (channels[pub]) { return; }
  channels[pub] = chat;
  const chatNode = State.local.get('channels').get(pub);
  chatNode.get('latestTime').on(t => {
    if (t && (!chat.latestTime || t > chat.latestTime)) {
      chat.latestTime = t;
    } else {
      // chatNode.get('latestTime').put(chat.latestTime); // omg recursion
    }
  });
  chatNode.get('theirMsgsLastSeenTime').on(t => {
    if (!t) { return; }
    const d = new Date(t);
    if (!chat.theirMsgsLastSeenDate || chat.theirMsgsLastSeenDate < d) {
      chat.theirMsgsLastSeenDate = d;
    }
  });
  chat.messageIds = chat.messageIds || {};
  chat.getLatestMsg && chat.getLatestMsg((latest, info) => {
    processMessage(pub, latest, info);
  });
  Notifications.changeChatUnseenCount(pub, 0);
  chat.notificationSetting = 'all';
  chat.onMy('notificationSetting', (val) => {
    chat.notificationSetting = val;
  });
  //$(".chat-list").append(el);
  chat.theirMsgsLastSeenTime = '';
  chat.getTheirMsgsLastSeenTime(time => {
    if (chat && time && time >= chat.theirMsgsLastSeenTime) {
      chat.theirMsgsLastSeenTime = time;
      chatNode.get('theirMsgsLastSeenTime').put(time);
    }
  });
  chat.getMyMsgsLastSeenTime(time => {
    chat.myLastSeenTime = new Date(time);
    if (chat.latest && chat.myLastSeenTime >= chat.latest.time) {
      Notifications.changeChatUnseenCount(pub, 0);
    }
    PeerManager.askForPeers(pub); // TODO: this should be done only if we have a chat history or friendship with them
  });
  chat.isTyping = false;
  chat.getTyping(isTyping => {
    chat.isTyping = isTyping;
    State.local.get('channels').get(pub).get('isTyping').put(isTyping);
  });
  chat.online = {};
  iris.Channel.getActivity(State.public, pub, (activity) => {
    if (chat) {
      chatNode.put({theirLastActiveTime: activity && activity.lastActive, activity: activity && activity.isActive && activity.status});
      chat.activity = activity;
    }
  });
  if (chat.uuid) {
    let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    chat.participantProfiles = {};
    chat.on('name', v => State.local.get('channels').get(chat.uuid).get('name').put(v));
    chat.on('photo', v => State.local.get('channels').get(chat.uuid).get('photo').put(v));
    chat.on('about', v => State.local.get('channels').get(chat.uuid).get('about').put(v));
    chat.getParticipants(participants => {
      if (typeof participants === 'object') {
        let keys = Object.keys(participants);
        keys.forEach((k, i) => {
          let hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
          chat.participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
          State.public.user(k).get('profile').get('name').on(name => {
            chat.participantProfiles[k].name = name;
          });
        });
      }
      State.local.get('channels').get(chat.uuid).get('participants').put(null);
      State.local.get('channels').get(chat.uuid).get('participants').put(participants);
    });
    chat.inviteLinks = {};
    chat.getChatLinks({callback: ({url, id}) => {
      console.log('got chat link', id, url);
      chat.inviteLinks[id] = url; // TODO use State
      State.local.get('inviteLinksChanged').put(true);
    }});
  } else {
    State.local.get('groups').get('everyone').get(pub).put(true);
    addFollow(null, pub, -1);
    State.public.user(pub).get('profile').get('name').on(v => State.local.get('channels').get(pub).get('name').put(v))
  }
  if (chat.put) {
    chat.onTheir('webPushSubscriptions', (s, k, from) => {
      if (!Array.isArray(s)) { return; }
      chat.webPushSubscriptions = chat.webPushSubscriptions || {};
      chat.webPushSubscriptions[from || pub] = s;
    });
    const arr = Object.values(Notifications.webPushSubscriptions);
    setTimeout(() => chat.put('webPushSubscriptions', arr), 5000);
    shareMyPeerUrl(chat);
  }
  chat.onTheir('call', call => {
    State.local.get('call').put({pub, call});
  });
  State.local.get('channels').get(pub).put({enabled:true});
  /* Disable private peer discovery, since they're not connecting anyway
  if (chat.onTheir) {
    chat.onTheir('my_peer', (url, k, from) => {
      console.log('Got private peer url', url, 'from', from);
      PeerManager.addPeer({url, from})
    });
  }
   */
}

function processMessage(chatId, msg, info) {
  const chat = channels[chatId];
  if (chat.messageIds[msg.time + info.from]) return;
  chat.messageIds[msg.time + info.from] = true;
  if (info) {
    msg = Object.assign(msg, info);
  }
  msg.selfAuthored = info.selfAuthored;
  State.local.get('channels').get(chatId).get('msgs').get(msg.time + (msg.from && msg.from.slice(0, 10))).put(JSON.stringify(msg));
  msg.timeObj = new Date(msg.time);
  if (!info.selfAuthored && msg.timeObj > (chat.myLastSeenTime || -Infinity)) {
    if (window.location.hash !== `#/chat/${  chatId}` || document.visibilityState !== 'visible') {
      Notifications.changeChatUnseenCount(chatId, 1);
    } else if (ourActivity === 'active') {
        chat.setMyMsgsLastSeenTime();
      }
  }
  if (!info.selfAuthored && msg.time > chat.theirMsgsLastSeenTime) {
    State.local.get('channels').get(chatId).get('theirMsgsLastSeenTime').put(msg.time);
  }
  if (!chat.latestTime || (msg.time > chat.latestTime)) {
    State.local.get('channels').get(chatId).put({
      latestTime: msg.time,
      latest: {time: msg.time, text: msg.text, selfAuthored: info.selfAuthored}
    });
  }
  Notifications.notifyMsg(msg, info, chatId);
}

function subscribeToMsgs(pub) {
  const c = channels[pub];
  if (c.subscribed) { return; }
  c.subscribed = true;
  c.getMessages((msg, info) => {
    processMessage(pub, msg, info);
  });
}

function followChatLink(str) {
  if (str && str.indexOf('http') === 0) {
    const s = str.split('?');
    let chatId;
    if (s.length === 2) {
      chatId = Helpers.getUrlParameter('chatWith', s[1]) || Helpers.getUrlParameter('channelId', s[1]);
    }
    if (chatId) {
      newChannel(chatId, str);
      route(`/chat/${  chatId}`);
      return true;
    }
    if (str.indexOf('https://iris.to') === 0) {
      route(str.replace('https://iris.to', ''));
      return true;
    }
  }
}

export default {init, followChatLink, getKey, getPubKey, ethereumLogin, updateUserSearchIndex, getUserSearchIndex, getMyName, getMyProfilePhoto, getMyChatLink, createChatLink, ourActivity, login, logOut, addFollow, removeFollow, loginAsNewUser, DEFAULT_SETTINGS, channels, newChannel, addChannel, processMessage, subscribeToMsgs };
