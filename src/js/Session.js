import {localState, publicState, showMenu} from './Main.js';
import {chats, addChat, newChat, showChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import { route } from './lib/preact-router.es.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let areWeOnline;
let activeRoute;
let activeProfile;

function setOurOnlineStatus() {
  iris.Channel.setOnline(publicState, areWeOnline = true);
  document.addEventListener("mousemove", () => {
    const chat = activeRoute && chats[activeRoute.replace('profile/','').replace('chat/','')];
    if (chat && !areWeOnline) {
      chat.setMyMsgsLastSeenTime();
    }
    iris.Channel.setOnline(publicState, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setOnline(publicState, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setOnline(publicState, areWeOnline = true);
      const chat = activeRoute && chats[activeRoute.replace('profile/','').replace('chat/','')];
      if (chat) {
        chat.setMyMsgsLastSeenTime();
        Notifications.changeChatUnseenCount(chat, 0);
      }
    } else {
      iris.Channel.setOnline(publicState, areWeOnline = false);
    }
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
  $('#generate-chat-link').off().on('click', createChatLink);
  $(".profile-link").attr('href', Helpers.getUserChatLink(key.pub)).off().on('click', e => {
    e.preventDefault();
    if (chats[key.pub]) {
      localState.get('activeRoute').put('profile/' + key.pub);
    }
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
  Helpers.setImgSrc($('#current-profile-photo'), '');
  $('#private-key-qr').empty();
  publicState.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      myName = name;
      $('.user-info .user-name').text(Helpers.truncateString(name, 20));
    }
  });
  publicState.user().get('profile').get('photo').on(data => {
    myProfilePhoto = data;
    if (!activeProfile) {
      Helpers.setImgSrc($('#current-profile-photo'), data);
      $('#add-profile-photo').toggleClass('hidden', true);
    }
  });
  Notifications.init();

  localState.get('activeRoute').on(a => {
    activeRoute = a;
    route(`/${a ? a : ''}`);
  });
  localState.get('activeProfile').on(a => activeProfile = a);
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


export {activeRoute, activeProfile};
export default {init, getKey, getMyName, getMyProfilePhoto, getMyChatLink, areWeOnline, login, logOut };
