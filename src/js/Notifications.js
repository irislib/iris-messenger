import Helpers from './Helpers.js';
import Session from './Session.js';
import { route } from './lib/preact-router.es.js';
import State from './State.js';

const notificationSound = new Audio('../../audio/notification.mp3');
let loginTime;
let unseenTotal;
const webPushSubscriptions = {};

function desktopNotificationsEnabled() {
  return window.Notification && Notification.permission === 'granted';
}

function enableDesktopNotifications() {
  if (window.Notification) {
    Notification.requestPermission(() => {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        $('#enable-notifications-prompt').slideUp();
      }
      if (Notification.permission === 'granted') {
        subscribeToWebPush();
      }
    });
  }
}

function notifyMsg(msg, info, pub) {
  function shouldNotify() {
    if (msg.timeObj < loginTime) { return false; }
    if (info.selfAuthored) { return false; }
    if (document.visibilityState === 'visible') { return false; }
    if (Session.channels[pub].notificationSetting === 'nothing') { return false; }
    if (Session.channels[pub].notificationSetting === 'mentions' && !msg.text.includes(Session.getMyName())) { return false; }
    return true;
  }
  function shouldDesktopNotify() {
    if (!desktopNotificationsEnabled()) { return false; }
    return shouldNotify();
  }
  function shouldAudioNotify() {
    return shouldNotify();
  }
  if (shouldAudioNotify()) {
    notificationSound.play();
  }
  if (shouldDesktopNotify()) {
    var body, title;
    if (Session.channels[pub].uuid) {
      title = Session.channels[pub].participantProfiles[info.from].name;
      body = `${name}: ${msg.text}`;
    } else {
      title = 'Message'
      body = msg.text;
    }
    body = Helpers.truncateString(body, 50);
    var desktopNotification = new Notification(title, { // TODO: replace with actual name
      icon: 'img/icon128.png',
      body,
      silent: true
    });
    desktopNotification.onclick = function() {
      route('/chat/' + pub);
      window.focus();
    };
  }
}

var initialTitle = document.title;
function setUnseenTotal() {
  if (unseenTotal) {
    document.title = '(' + unseenTotal + ') ' + initialTitle;
  } else {
    document.title = initialTitle;
  }
}

function changeChatUnseenCount(chatId, change) {
  const chat = Session.channels[chatId];
  if (!chat) return;
  const chatNode = State.local.get('channels').get(chatId);
  if (change) {
    unseenTotal += change;
    chat.unseen += change;
  } else {
    unseenTotal = unseenTotal - (chat.unseen || 0);
    chat.unseen = 0;
  }
  chatNode.get('unseen').put(chat.unseen);
  unseenTotal = unseenTotal >= 0 ? unseenTotal : 0;
  State.local.get('unseenTotal').put(unseenTotal);
  setUnseenTotal();
}

const publicVapidKey = 'BMqSvZArOIdn7vGkYplSpkZ70-Qt8nhYbey26WVa3LF3SwzblSzm3n3HHycpNkAKVq7MCkrzFuTFs_en7Y_J2MI';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribe(reg) {
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  addWebPushSubscription(subscription);
}

async function subscribeToWebPush() {
  if (!desktopNotificationsEnabled() || !navigator.serviceWorker) { return false; }
  await navigator.serviceWorker.ready;
  const reg = await navigator.serviceWorker.getRegistration();
  reg.active.postMessage({key: Session.getKey()});
  const sub = await reg.pushManager.getSubscription();
  sub ? addWebPushSubscription(sub) : subscribe(reg);
}

const addWebPushSubscriptionsToChats = _.debounce(() => {
  const arr = Object.values(webPushSubscriptions);
  Object.values(Session.channels).forEach(channel => {
    if (channel.put) {
      channel.put('webPushSubscriptions', arr);
    }
  });
}, 5000);

function removeSubscription(hash) {
  delete webPushSubscriptions[hash];
  State.public.user().get('webPushSubscriptions').get(hash).put(null);
  addWebPushSubscriptionsToChats();
}

async function addWebPushSubscription(s, saveToGun = true) {
  const myKey = Session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  const enc = await Gun.SEA.encrypt(s, mySecret);
  const hash = await iris.util.getHash(JSON.stringify(s));
  if (saveToGun) {
    State.public.user().get('webPushSubscriptions').get(hash).put(enc);
  }
  webPushSubscriptions[hash] = s;
  addWebPushSubscriptionsToChats();
}

async function getWebPushSubscriptions() {
  const myKey = Session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  State.public.user().get('webPushSubscriptions').map().on(async enc => {
    if (!enc) { return; }
    const s = await Gun.SEA.decrypt(enc, mySecret);
    addWebPushSubscription(s, false);
  });
}

function init() {
  loginTime = new Date();
  unseenTotal = 0;
}

export default {init, notifyMsg, enableDesktopNotifications, changeChatUnseenCount, webPushSubscriptions, subscribeToWebPush, getWebPushSubscriptions, removeSubscription};
