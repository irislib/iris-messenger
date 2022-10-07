import Gun from 'gun';
import Notifications from './Notifications';
import PeerManager from './peers';
import Channel from './Channel';
import util from './util';
import _ from 'lodash';
import Fuse from "fuse.js";
import localforage from 'localforage';
import local from './local';
import electron from './electron';
import publicState from './public';
import privateState from './private';
import blockedUsers from './blockedUsers';

let key;
let myName;
let latestChatLink;
let onlineTimeout;
let ourActivity;
let noFollows;
let noFollowers;
let searchIndex;
const searchableItems = {};
const getExtendedFollowsCalled = {};

const DEFAULT_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

const DEFAULT_SETTINGS = {
  electron: {
    openAtLogin: true,
    minimizeOnClose: true
  },
  local: {
    enableWebtorrent: !util.isMobile,
    enablePublicPeerDiscovery: true,
    autoplayWebtorrent: true,
    maxConnectedPeers: util.isElectron ? 3 : 2
  }
}

/**
 * User session management utilities.
 */
export default {
  /**
   * Log in with a key from localStorage.
   *
   * If no key is found and options.autologin is not false, a new user will be created.
   *
   * If options.autofollow is not false, the default follow will be added.
   * @param options
   */
  init(options = {}) {
    let localStorageKey = localStorage.getItem('chatKeyPair');
    if (localStorageKey) {
      this.login(JSON.parse(localStorageKey));
    } else if (options.autologin !== false) {
      this.loginAsNewUser(options);
    } else {
      this.clearIndexedDB();
    }
    setTimeout(() => {
      local().get('block').map(() => {
        this.updateSearchIndex();
      });
      this.updateSearchIndex();
    });
    setInterval(() => {
      if (this.taskQueue.length) {
        //console.log('this.taskQueue', this.taskQueue.length);
        this.taskQueue.shift()();
      }
    }, 10);
  },

  DEFAULT_SETTINGS,
  DEFAULT_FOLLOW,

  taskQueue: [],

  updateSearchIndex: _.throttle(() => {
    const options = {keys: ['name'], includeScore: true, includeMatches: true, threshold: 0.3};
    const values = Object.values(_.omit(searchableItems, Object.keys(blockedUsers())));
    searchIndex = new Fuse(values, options);
    local().get('searchIndexUpdated').put(true);
  }, 2000, {leading:true}),

  saveSearchResult: _.throttle(k => {
      local().get('contacts').get(k).put({followDistance: searchableItems[k].followDistance,followerCount: searchableItems[k].followers.size});
  }, 1000, {leading:true}),

  addFollow(callback, k, followDistance, follower) {
    if (searchableItems[k]) {
      if (searchableItems[k].followDistance > followDistance) {
        searchableItems[k].followDistance = followDistance;
      }
      searchableItems[k].followers.add(follower);
    } else {
      searchableItems[k] = {key: k, followDistance, followers: new Set(follower && [follower])};
      this.taskQueue.push(() => {
        publicState().user(k).get('profile').get('name').on(name => {
          searchableItems[k].name = name;
          local().get('contacts').get(k).get('name').put(name);
          callback && callback(k, searchableItems[k]);
        });
      });
    }
    this.saveSearchResult(k);
    callback && callback(k, searchableItems[k]);
    this.updateSearchIndex();
    this.updateNoFollows();
    this.updateNoFollowers();
  },

  removeFollow(k, followDistance, follower) {
    if (searchableItems[k]) {
      searchableItems[k].followers.delete(follower);
      if (followDistance === 1) {
        local().get('groups').get('follows').get(k).put(false);
      }
      this.updateNoFollows();
      this.updateNoFollowers();
    }
  },

  getExtendedFollows(callback, k, maxDepth = 3, currentDepth = 1) {
    if (getExtendedFollowsCalled[k] <= currentDepth) {
      return;
    }
    getExtendedFollowsCalled[k] = currentDepth;

    k = k || key.pub;

    this.addFollow(callback, k, currentDepth - 1);

    publicState().user(k).get('follow').map().on((isFollowing, followedKey) => { // TODO: unfollow
      if (isFollowing) {
        this.addFollow(callback, followedKey, currentDepth, k);
        if (currentDepth < maxDepth) {
          this.taskQueue.push(() => this.getExtendedFollows(callback, followedKey, maxDepth, currentDepth + 1));
        }
      } else {
        this.removeFollow(followedKey, currentDepth, k);
      }
    });

    return searchableItems;
  },

  updateNoFollows: _.throttle(() => {
    const v = Object.keys(searchableItems).length <= 1;
    if (v !== noFollows) {
      noFollows = v;
      local().get('noFollows').put(noFollows);
    }
  }, 1000, {leading:true}),

  updateNoFollowers: _.throttle(() => {
    const v = !(searchableItems[key.pub] && (searchableItems[key.pub].followers.size > 0));
    if (v !== noFollowers) {
      noFollowers = v;
      local().get('noFollowers').put(noFollowers);
    }
  }, 1000, {leading:true}),

  getSearchIndex() {
    return searchIndex;
  },

  setOurOnlineStatus() {
    const activeRoute = window.location.hash;
    Channel.setActivity(ourActivity = 'active');
    const setActive = _.debounce(() => {
      const chatId = activeRoute && activeRoute.replace('#/profile/','').replace('#/chat/','');
      const chat = privateState(chatId);
      if (chat && !ourActivity) {
        chat.setMyMsgsLastSeenTime();
      }
      Channel.setActivity(ourActivity = 'active');
      clearTimeout(onlineTimeout);
      onlineTimeout = setTimeout(() => Channel.setActivity(ourActivity = 'online'), 30000);
    }, 1000);
    document.addEventListener("touchmove", setActive);
    document.addEventListener("mousemove", setActive);
    document.addEventListener("keypress", setActive);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'visible') {
        Channel.setActivity(ourActivity = 'active');
        const chatId = location.pathname.slice(1).replace('chat/','');
        const chat = activeRoute && privateState(chatId);
        if (chat) {
          chat.setMyMsgsLastSeenTime();
          Notifications.changeChatUnseenCount(chatId, 0);
        }
      } else {
        Channel.setActivity(ourActivity = 'online');
      }
    });
    setActive();
    window.addEventListener("beforeunload", () => {
      Channel.setActivity(ourActivity = null);
    });
  },

  updateGroups() {
    this.getExtendedFollows((k, info) => {
      if (info.followDistance <= 1) {
        local().get('groups').get('follows').get(k).put(true);
      }
      local().get('groups').get('everyone').get(k).put(true);
      if (k === this.getPubKey()) {
        this.updateNoFollowers();
      }
    });
  },

  /**
   * Log in with a private key.
   * @param key
   */
  login(k) {
    const shouldRefresh = !!key;
    key = k;
    localStorage.setItem('chatKeyPair', JSON.stringify(k));
    publicState().user().auth(key);
    publicState().user().put({epub: key.epub});
    Notifications.subscribeToWebPush();
    Notifications.getWebPushSubscriptions();
    Notifications.subscribeToIrisNotifications();
    Channel.getMyChatLinks(key, undefined, chatLink => {
      local().get('chatLinks').get(chatLink.id).put(chatLink.url);
      latestChatLink = chatLink.url;
    });
    this.setOurOnlineStatus();
    Channel.getChannels(key, c => this.addChannel(c));
    publicState().user().get('profile').get('name').on(name => {
      if (name && typeof name === 'string') {
        myName = name;
      }
    });
    Notifications.init();
    local().get('loggedIn').put(true);
    local().get('settings').once().then(settings => {
      if (!settings) {
        local().get('settings').put(DEFAULT_SETTINGS.local);
      } else if (settings.enableWebtorrent === undefined || settings.autoplayWebtorrent === undefined) {
        local().get('settings').get('enableWebtorrent').put(DEFAULT_SETTINGS.local.enableWebtorrent);
        local().get('settings').get('autoplayWebtorrent').put(DEFAULT_SETTINGS.local.autoplayWebtorrent);
      }
    });
    publicState().user().get('block').map().on((isBlocked, user) => {
      local().get('block').get(user).put(isBlocked);
      if (isBlocked) {
        delete searchableItems[user];
      }
    });
    this.updateGroups();
    if (shouldRefresh) {
      location.reload();
    }
    if (electron) {
      electron.get('settings').on(electron => {
        local().get('settings').get('electron').put(electron);
        if (electron.publicIp) {
          this.channelIds.forEach(id => privateState(id).shareMyPeerUrl());
        }
      });
      electron.get('user').put(key.pub);
    }
    local().get('filters').get('group').once().then(v => {
      if (!v) {
        local().get('filters').get('group').put('follows');
      }
    });
  },

  /**
   * Create a new user account and log in.
   * @param options {Object} - Options for the new account.
   * @returns {Promise<*>}
   */
  loginAsNewUser(options = {}) {
    name = options.name || util.generateName();
    console.log('loginAsNewUser name', name);
    return Gun.SEA.pair().then(k => {
      this.login(k);
      publicState().user().get('profile').put({a:null});
      publicState().user().get('profile').get('name').put(name);
      local().get('filters').put({a:null});
      local().get('filters').get('group').put('follows');
      this.createChatLink();
      setTimeout(() => {
        if (options.autofollow !== false) {
          console.log('autofollowing', DEFAULT_FOLLOW);
          publicState().user().get('follow').get(DEFAULT_FOLLOW).put(true);
        }
      }, 100); // maybe wait for login return instead
    });
  },

  /**
   * Log out the current user.
   * @returns {Promise<void>}
   */
  async logOut() {
    if (electron) {
      electron.get('user').put(null);
    }
    // TODO: remove subscription from your channels
    if (navigator.serviceWorker) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.pushManager) {
        reg.active.postMessage({key: null});
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const hash = await util.getHash(JSON.stringify(sub));
          Notifications.removeSubscription(hash);
          sub.unsubscribe && sub.unsubscribe();
        }
      }
    }
    this.clearIndexedDB();
    localStorage.clear(); // TODO clear only iris data
    localforage.clear().then(() => {
      window.location.hash = '';
      window.location.href = '/';
      location.reload();
    });
  },

  async createChatLink() {
    latestChatLink = await Channel.createChatLink(key);
  },

  clearIndexedDB() {
    return new Promise(resolve => {
      const r1 = window.indexedDB.deleteDatabase('local()');
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
  },

  getMyChatLink() {
    return latestChatLink || util.getProfileLink(key.pub);
  },

  /**
   * Get the keypair of the logged in user.
   * @returns {*}
   */
  getKey() { return key; },

  /**
   * Get the public key of the logged in user.
   * @returns {*}
   */
  getPubKey() {
    return key && key.pub;
  },

  /**
   * Get the name of the logged in user.
   * @returns {*}
   */
  getMyName() { return myName; }, // TODO maybe remove and use iris.user().get('profile').get('name') instead?

  myPeerUrl: ip => `http://${ip}:8767/gun`,

  async shareMyPeerUrl(channel) {
    const myIp = await local().get('settings').get('electron').get('publicIp').once();
    myIp && channel.put && channel.put('my_peer', this.myPeerUrl(myIp));
  },

  newChannel(pub, chatLink) {
    if (!pub || this.channelIds.has(pub)) {
      return;
    }
    const chat = privateState(pub, chatLink);
    this.addChannel(chat);
    return chat;
  },

  addChannel(chat) {
    this.taskQueue.push(() => {
      let pub = chat.getId();
      if (this.channelIds.has(pub)) { return; }
      this.channelIds.add(pub);
      const chatNode = local().get('channels').get(pub);
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
      chat.getLatestMsg && chat.getLatestMsg((latest, info) => {
        this.processMessage(pub, latest, info);
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
        local().get('channels').get(pub).get('isTyping').put(isTyping);
      });
      chat.online = {};
      Channel.getActivity(pub, (activity) => {
        if (chat) {
          chatNode.put({theirLastActiveTime: activity && activity.lastActive, activity: activity && activity.isActive && activity.status});
          chat.activity = activity;
        }
      });
      if (chat.uuid) {
        let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        chat.participantProfiles = {};
        chat.on('name', v => {
          chat.name = v;
          searchableItems[chat.uuid] = {name: v, uuid: chat.uuid};
          local().get('channels').get(chat.uuid).get('name').put(v);
        });
        chat.on('photo', v => {
          searchableItems[chat.uuid] = searchableItems[chat.uuid] || {};
          searchableItems[chat.uuid].photo = v;
          local().get('channels').get(chat.uuid).get('photo').put(v)
        });
        chat.on('about', v => local().get('channels').get(chat.uuid).get('about').put(v));
        chat.getParticipants(participants => {
          delete participants.undefined; // TODO fix where it comes from
          if (typeof participants === 'object') {
            let keys = Object.keys(participants);
            keys.forEach((k, i) => {
              let hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
              chat.participantProfiles[k] = {permissions: participants[k], color: `hsl(${hue}, 98%, ${isDarkMode ? 80 : 33}%)`};
              publicState().user(k).get('profile').get('name').on(name => {
                chat.participantProfiles[k].name = name;
              });
            });
          }
          local().get('channels').get(chat.uuid).get('participants').put(participants);
        });
        chat.inviteLinks = {};
        chat.getChatLinks({callback: ({url, id}) => {
          console.log('got chat link', id, url);
          chat.inviteLinks[id] = url; // TODO use State
          local().get('inviteLinksChanged').put(true);
        }});
      } else {
        local().get('groups').get('everyone').get(pub).put(true);
        this.addFollow(null, pub, Infinity);
        publicState().user(pub).get('profile').get('name').on(v => local().get('channels').get(pub).get('name').put(v))
      }
      if (chat.put) {
        chat.onTheir('webPushSubscriptions', (s, k, from) => {
          if (!Array.isArray(s)) { return; }
          chat.webPushSubscriptions = chat.webPushSubscriptions || {};
          chat.webPushSubscriptions[from || pub] = s;
        });
        const arr = Object.values(Notifications.webPushSubscriptions);
        setTimeout(() => chat.put('webPushSubscriptions', arr), 5000);
        this.shareMyPeerUrl(chat);
      }
      chat.onTheir('call', call => {
        local().get('call').put({pub, call});
      });
      local().get('channels').get(pub).put({enabled:true});
      /* Disable private peer discovery, since they're not connecting anyway
      if (chat.onTheir) {
        chat.onTheir('my_peer', (url, k, from) => {
          console.log('Got private peer url', url, 'from', from);
          PeerManager.addPeer({url, from})
        });
      }
       */

    });
  },

  processMessage(chatId, msg, info, onClickNotification) {
    const chat = privateState(chatId);
    chat.messageIds = chat.messageIds || {};
    if (chat.messageIds[msg.time + info.from]) return;
    chat.messageIds[msg.time + info.from] = true;
    if (info) {
      msg = Object.assign(msg, info);
    }
    if (msg.invite) {
      const chatLink = `https://iris.to/?channelId=${msg.invite.group}&inviter=${chatId}`;
      this.newChannel(msg.invite.group, chatLink);
      return;
    }
    msg.selfAuthored = info.selfAuthored;
    local().get('channels').get(chatId).get('msgs').get(msg.time + (msg.from && msg.from.slice(0, 10))).put(JSON.stringify(msg));
    msg.timeObj = new Date(msg.time);
    if (!info.selfAuthored && msg.timeObj > chat.myLastSeenTime) {
      if (window.location.hash !== `#/chat/${  chatId}` || document.visibilityState !== 'visible') {
        Notifications.changeChatUnseenCount(chatId, 1);
      } else if (ourActivity === 'active') {
          chat.setMyMsgsLastSeenTime();
        }
    }
    if (!info.selfAuthored && msg.time > chat.theirMsgsLastSeenTime) {
      local().get('channels').get(chatId).get('theirMsgsLastSeenTime').put(msg.time);
    }
    if (!chat.latestTime || (msg.time > chat.latestTime)) {
      local().get('channels').get(chatId).put({
        latestTime: msg.time,
        latest: {time: msg.time, text: msg.text, selfAuthored: info.selfAuthored}
      });
    }
    // TODO: onclickNotification should do       route(`/chat/${  pub}`);
    Notifications.notifyMsg(msg, info, chatId, onClickNotification);
  },

  subscribeToMsgs(pub) {
    const c = privateState(pub);
    if (c.subscribed) { return; }
    c.subscribed = true;
    c.getMessages((msg, info) => {
      this.processMessage(pub, msg, info);
    });
  },

  /**
   * Known private channels with other users
   */
  channelIds: new Set(),
};
