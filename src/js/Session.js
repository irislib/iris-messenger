import State from './State.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import { route } from './lib/preact-router.es.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let ourActivity;
let hasFollowers;
const follows = {};
const blocks = {};
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
    maxConnectedPeers: iris.util.isElectron ? 2 : 1
  }
}

const settings = DEFAULT_SETTINGS;

function getFollowsFn(callback, k, maxDepth = 2, currentDepth = 1) {
  k = k || key.pub;

  function addFollow(k, followDistance, follower) {
    if (follows[k]) {
      if (follows[k].followDistance > followDistance) {
        follows[k].followDistance = followDistance;
      }
      follows[k].followers.add(follower);
    } else {
      follows[k] = {key: k, followDistance, followers: new Set(follower && [follower])};
      State.public.user(k).get('profile').get('name').on(name => {
        follows[k].name = name;
        callback(k, follows[k]);
      });
    }
    callback(k, follows[k]);
  }

  addFollow(k, currentDepth - 1);

  State.public.user(k).get('follow').map().on((isFollowing, followedKey) => { // TODO: .on for unfollow
    if (follows[followedKey] === isFollowing) { return; }
    if (isFollowing) {
      addFollow(followedKey, currentDepth, k);
      if (currentDepth < maxDepth) {
        getFollowsFn(callback, followedKey, maxDepth, currentDepth + 1);
      }
    }
  });

  return follows;
}

function setOurOnlineStatus() {
  const activeRoute = window.location.hash;
  iris.Channel.setActivity(State.public, ourActivity = 'active');
  const setActive = _.debounce(() => {
    const chat = activeRoute && channels[activeRoute.replace('#/profile/','').replace('#/chat/','')];
    if (chat && !ourActivity) {
      chat.setMyMsgsLastSeenTime();
    }
    iris.Channel.setActivity(State.public, ourActivity = 'active'); // TODO: also on keypress
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setActivity(State.public, ourActivity = 'online'), 30000);
  }, 1000);
  document.addEventListener("touchmove", setActive);
  document.addEventListener("mousemove", setActive);
  document.addEventListener("keypress", setActive);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setActivity(State.public, ourActivity = 'active');
      const chatId = activeRoute.replace('#/profile/','').replace('#/chat/','');
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

function login(k) {
  const shouldRefresh = !!key;
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  iris.Channel.initUser(State.public, key);
  Notifications.subscribeToWebPush();
  Notifications.getWebPushSubscriptions();
  iris.Channel.getMyChatLinks(State.public, key, undefined, chatLink => {
    State.local.get('chatLinks').get(chatLink.id).put(chatLink.url);
    latestChatLink = chatLink.url;
  });
  setOurOnlineStatus();
  iris.Channel.getChannels(State.public, key, addChannel);
  var chatId = Helpers.getUrlParameter('chatWith') || Helpers.getUrlParameter('channelId');
  var inviter = Helpers.getUrlParameter('inviter');
  function go() {
    if (inviter !== key.pub) {
      newChannel(chatId, window.location.href);
    }
    _.defer(() => route('/chat/' + chatId)); // defer because router is only initialised after login
    window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
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
  State.public.get('follow').put({a:null});
  State.local.get('follows').put({a:null});
  Notifications.init();
  State.local.get('loggedIn').put(true);
  State.public.get('block').map().on((isBlocked, user) => {
    blocks[user] = isBlocked;
    isBlocked && (follows[user] = null);
    State.local.get('follows').get(user).put(isBlocked);
  });
  getFollowsFn((k, info) => {
    State.local.get('follows').get(k).put(true);
    if (!hasFollowers && k === getPubKey() && info.followers.size) {
      State.local.get('noFollowers').put(false);
    }
  });
  State.public.user().get('msgs').put({a:null}); // These need to be initialised for some reason, otherwise 1st write is slow
  State.public.user().get('replies').put({a:null});
  State.public.user().get('likes').put({a:null});
  if (shouldRefresh) {
    location.reload();
  }
  State.electron && State.electron.get('settings').on(electron => {
    settings.electron = electron;
  });
  State.local.get('settings').on(local => {
    settings.local = local;
  });
}

async function createChatLink() {
  latestChatLink = await iris.Channel.createChatLink(State.public, key);
}

function clearIndexedDB() {
  window.indexedDB.deleteDatabase('State.local');
  window.indexedDB.deleteDatabase('radata');
}

function getMyChatLink() {
  return latestChatLink || Helpers.getProfileLink(key.pub);
}

function removeChatLink(id) {
  console.log('removeChatLink', id);
  State.local.get('chatLinks').get(id).put(null);
  return iris.Channel.removeChatLink(State.public, key, id);
}

function getKey() { return key; }
function getMyName() { return myName; }
function getMyProfilePhoto() { return myProfilePhoto; }

async function logOut() {
  // TODO: remove subscription from your channels
  if (navigator.serviceWorker) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      reg.active.postMessage({key: null});
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const hash = await iris.util.getHash(JSON.stringify(sub));
        Notifications.removeSubscription(hash);
        sub.unsubscribe && sub.unsubscribe();
      }
    }
  }
  await clearIndexedDB();
  localStorage.clear();
  route('/');
  location.reload();
}

function getPubKey() {
  return key && key.pub;
}

function loginAsNewUser(name) {
  name = name || Helpers.generateName();
  return Gun.SEA.pair().then(k => {
    login(k);
    name && State.public.user().get('profile').get('name').put(name);
    createChatLink();
    State.local.get('noFollows').put(true);
    State.local.get('noFollowers').put(true);
  });
}

function init(options = {}) {
  var localStorageKey = localStorage.getItem('chatKeyPair');
  if (localStorageKey) {
    login(JSON.parse(localStorageKey));
  } else if (options.autologin) {
    loginAsNewUser(name);
  }
}

function getFollows() {
  return follows;
}

function newChannel(pub, chatLink) {
  if (!pub || Object.prototype.hasOwnProperty.call(channels, pub)) {
    return;
  }
  const chat = new iris.Channel({gun: State.public, key, chatLink: chatLink, participants: pub});
  addChannel(chat);
}

function addChannel(chat) {
  var pub = chat.getId();
  if (channels[pub]) { return; }
  channels[pub] = chat;
  const chatNode = State.local.get('channels').get(pub);
  chatNode.get('latestTime').on(t => {
    if (t && (!chat.latestTime || t > chat.latestTime)) {
      chat.latestTime = t;
    } else {
      chatNode.get('latestTime').put(chat.latestTime);
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
    if (chat && time && time > chat.theirMsgsLastSeenTime) {
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
    chat.participantProfiles = {};
    chat.on('name', v => State.local.get('channels').get(chat.uuid).get('name').put(v));
    chat.on('photo', v => State.local.get('channels').get(chat.uuid).get('photo').put(v));
    chat.on('about', v => State.local.get('channels').get(chat.uuid).get('about').put(v));
    chat.onMy('participants', participants => {
      if (typeof participants === 'object') {
        var keys = Object.keys(participants);
        keys.forEach((k, i) => {
          if (chat.participantProfiles[k]) { return; }
          var hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
          chat.participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
          State.public.user(k).get('profile').get('name').on(name => {
            chat.participantProfiles[k].name = name;
          });
        });
      }
      State.local.get('channels').get(chat.uuid).get('participants').put(participants);
    });
    var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
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
  }
  chat.onTheir('call', call => {
    State.local.get('call').put({pub, call});
  });
  State.local.get('channels').get(pub).put({enabled:true});
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
    if (window.location.hash !== '#/chat/' + chatId || document.visibilityState !== 'visible') {
      Notifications.changeChatUnseenCount(chatId, 1);
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

export default {init, getKey, getPubKey, getMyName, getMyProfilePhoto, getMyChatLink, createChatLink, removeChatLink, ourActivity, login, logOut, getFollows, loginAsNewUser, DEFAULT_SETTINGS, settings, channels, newChannel, addChannel, processMessage, subscribeToMsgs };
