import {activeRoute} from './Main.js';
import State from './State.js';
import {chats, addChat, newChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import { route } from './lib/preact-router.es.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let ourActivity;
let hasFollowers;
const follows = {};

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

  State.public.user(k).get('follow').map().once((isFollowing, followedKey) => { // TODO: .on for unfollow
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
  iris.Channel.setActivity(State.public, ourActivity = 'active');
  const setActive = _.debounce(() => {
    const chat = activeRoute && chats[activeRoute.replace('/profile/','').replace('/chat/','')];
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
      const chatId = activeRoute.replace('/profile/','').replace('/chat/','');
      const chat = activeRoute && chats[chatId];
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
  iris.Channel.getChannels(State.public, key, addChat);
  var chatId = Helpers.getUrlParameter('chatWith') || Helpers.getUrlParameter('channelId');
  var inviter = Helpers.getUrlParameter('inviter');
  function go() {
    if (inviter !== key.pub) {
      newChat(chatId, window.location.href);
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
  getFollowsFn((k, info) => {
    State.local.get('follows').get(k).put(true);
    if (!hasFollowers && k === getPubKey() && info.followers.size) {
      State.local.get('noFollowers').put(false);
    }
  });
  State.public.user().get('msgs').put({a:null});
  State.public.user().get('replies').put({a:null});
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
  // TODO: remove subscription from your chats
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

function init() {
  var localStorageKey = localStorage.getItem('chatKeyPair');
  if (localStorageKey) {
    login(JSON.parse(localStorageKey));
  }
}

function getFollows() {
  return follows;
}

export default {init, getKey, getPubKey, getMyName, getMyProfilePhoto, getMyChatLink, createChatLink, removeChatLink, ourActivity, login, logOut, getFollows };
