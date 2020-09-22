import {localState, publicState, showMenu, activeRoute} from './Main.js';
import {chats, addChat, newChat, showChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let ourActivity;

function setOurOnlineStatus() {
  iris.Channel.setActivity(publicState, ourActivity = 'active');
  const setActive = _.debounce(() => {
    const chat = activeRoute && chats[activeRoute.replace('/profile/','').replace('/chat/','')];
    if (chat && !ourActivity) {
      chat.setMyMsgsLastSeenTime();
    }
    iris.Channel.setActivity(publicState, ourActivity = 'active'); // TODO: also on keypress
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setActivity(publicState, ourActivity = 'online'), 30000);
  }, 1000);
  document.addEventListener("mousemove", setActive);
  document.addEventListener("keypress", setActive);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setActivity(publicState, ourActivity = 'active');
      const chat = activeRoute && chats[activeRoute.replace('/profile/','').replace('/chat/','')];
      if (chat) {
        chat.setMyMsgsLastSeenTime();
        Notifications.changeChatUnseenCount(chat, 0);
      }
    } else {
      iris.Channel.setActivity(publicState, ourActivity = 'online');
    }
  });
  window.addEventListener("beforeunload", () => {
    iris.Channel.setActivity(publicState, ourActivity = null);
  });
}

function login(k) {
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  iris.Channel.initUser(publicState, key);
  Notifications.subscribeToWebPush();
  Notifications.getWebPushSubscriptions();
  iris.Channel.getMyChatLinks(publicState, key, undefined, chatLink => {
    localState.get('chatLinks').get(key).put(chatLink);
    latestChatLink = chatLink.url;
  });
  setOurOnlineStatus();
  iris.Channel.getChannels(publicState, key, addChat);
  var chatId = Helpers.getUrlParameter('chatWith') || Helpers.getUrlParameter('channelId');
  var inviter = Helpers.getUrlParameter('inviter');
  function go() {
    if (inviter !== key.pub) {
      newChat(chatId, window.location.href);
    }
    showChat(chatId);
    window.history.pushState({}, "Iris Chat", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]); // remove param
  }
  if (chatId) {
    if (inviter) {
      setTimeout(go, 2000); // wait a sec to not re-create the same chat
    } else {
      go();
    }
  } else {
    if (iris.util.isMobile) {
      showMenu();
    }
  }
  publicState.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      myName = name;
    }
  });
  publicState.user().get('profile').get('photo').on(data => {
    myProfilePhoto = data;
  });
  Notifications.init();
  localState.get('loggedIn').put(true);
}

async function createChatLink() {
  latestChatLink = await iris.Channel.createChatLink(publicState, key);
}

function clearIndexedDB() {
  window.indexedDB.deleteDatabase('localState');
  window.indexedDB.deleteDatabase('radata');
}

function getMyChatLink() {
  return latestChatLink || Helpers.getUserChatLink(key.pub);
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
  location.reload();
}

function init() {
  var localStorageKey = localStorage.getItem('chatKeyPair');
  if (localStorageKey) {
    login(JSON.parse(localStorageKey));
  }
}

export default {init, getKey, getMyName, getMyProfilePhoto, getMyChatLink, createChatLink, ourActivity, login, logOut };
