import Helpers from './Helpers';
import Session from './Session';
import { route } from 'preact-router';
import State from './State';
import _ from 'lodash';
import iris from './iris-lib';
import Gun from 'gun';
import $ from 'jquery';

const notificationSound = new Audio('../../assets/audio/notification.mp3');
let loginTime;
let unseenMsgsTotal;
let unseenNotificationCount;
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
    let body, title;
    if (Session.channels[pub].uuid) {
      title = Session.channels[pub].participantProfiles[info.from].name;
      body = `${name}: ${msg.text}`;
    } else {
      title = 'Message'
      body = msg.text;
    }
    body = Helpers.truncateString(body, 50);
    let desktopNotification = new Notification(title, { // TODO: replace with actual name
      icon: '/assets/img/icon128.png',
      body,
      silent: true
    });
    desktopNotification.onclick = function() {
      changeUnseenNotificationCount(-1);
      route(`/chat/${  pub}`);
      window.focus();
    };
  }
}

function changeChatUnseenMsgsCount(chatId, change) {
  const chat = Session.channels[chatId];
  if (!chat) return;
  const chatNode = State.local.get('channels').get(chatId);
  if (change) {
    unseenMsgsTotal += change;
    chat.unseen += change;
  } else {
    unseenMsgsTotal = unseenMsgsTotal - (chat.unseen || 0);
    chat.unseen = 0;
  }
  chatNode.get('unseen').put(chat.unseen);
  unseenMsgsTotal = unseenMsgsTotal >= 0 ? unseenMsgsTotal : 0;
  State.local.get('unseenMsgsTotal').put(unseenMsgsTotal);
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
  try {
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    addWebPushSubscription(subscription);
  } catch (e) {
    console.error('web push subscription error', e);
  }
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

function getEpub(user) {
  return new Promise(resolve => {
    State.public.user(user).get('epub').on(async (epub,k,x,e) => {
      if (epub) {
        e.off();
        resolve(epub);
      }
    });
  });
}

async function getNotificationText(notification) {
  const name = await State.public.user(notification.from).get('profile').get('name').once();
  const event = notification.event || notification.action;
  let eventText;
  if (event === 'like') eventText = `${name} liked your post`;
  else if (event === 'reply') eventText = `${name} replied to your post`;
  else if (event === 'mention') eventText = `${name} mentioned you in their post`;
  else if (event === 'follow') eventText = `${name} started following you`;
  else eventText = `${name} sent you a notification: ${event}`;
  return eventText;
}

function subscribeToIrisNotifications() {
  let notificationsSeenTime;
  let notificationsShownTime;
  State.public.user().get('notificationsSeenTime').on(v => {
    notificationsSeenTime = v;
    console.log(v);
  });
  State.public.user().get('notificationsShownTime').on(v => notificationsShownTime = v);
  const setNotificationsShownTime = _.debounce(() => {
    State.public.user().get('notificationsShownTime').put(new Date().toISOString());
  }, 1000);
  const alreadyHave = new Set();
  setTimeout(() => {
    State.group().on(`notifications/${Session.getPubKey()}`, async (encryptedNotification, k, x, e, from) => {
      const id = from.slice(0,30) + encryptedNotification.slice(0,30);
      if (alreadyHave.has(id)) { return; }
      alreadyHave.add(id);
      const epub = await getEpub(from);
      const secret = await Gun.SEA.secret(epub, Session.getKey());
      const notification = await Gun.SEA.decrypt(encryptedNotification, secret);
      if (!notification || typeof notification !== 'object') { return; }
      setNotificationsShownTime();
      notification.from = from;
      State.local.get('notifications').get(notification.time).put(notification);
      if (!notificationsSeenTime || notificationsSeenTime < notification.time) {
        changeUnseenNotificationCount(1);
      }
      if (!notificationsShownTime || notificationsShownTime < notification.time) {
        console.log('was new!');
        const text = await getNotificationText(notification);
        let desktopNotification = new Notification(text, {
          icon: '/assets/img/icon128.png',
          body: text,
          silent: true
        });
        desktopNotification.onclick = function() {
          const link = notification.target ? `/post/${notification.target}` : `/profile/${notification.from}`;
          route(link);
          changeUnseenNotificationCount(-1);
          window.focus();
        };
      }
    });
  }, 2000);
}

function changeUnseenNotificationCount(change) {
  if (!change) {
    unseenNotificationCount = 0;
    State.public.user().get('notificationsSeenTime').put(new Date().toISOString());
  } else {
    unseenNotificationCount += change;
    unseenNotificationCount = Math.max(unseenNotificationCount, 0);
  }
  State.local.get('unseenNotificationCount').put(unseenNotificationCount);
}

async function sendIrisNotification(recipient, notification) {
  if (!(recipient && notification)) { return; } // TODO: use typescript or sth :D
  if (typeof notification === 'object') { notification.time = new Date().toISOString() }
  const epub = await getEpub(recipient);
  const secret = await Gun.SEA.secret(epub, Session.getKey());
  const enc = await Gun.SEA.encrypt(notification, secret);
  State.public.user().get('notifications').get(recipient).put(enc);
}

function init() {
  loginTime = new Date();
  unseenMsgsTotal = 0;
  changeUnseenNotificationCount(0);
}

export default {init, notifyMsg, getNotificationText, changeUnseenNotificationCount, subscribeToIrisNotifications, sendIrisNotification, enableDesktopNotifications, changeChatUnseenCount: changeChatUnseenMsgsCount, webPushSubscriptions, subscribeToWebPush, getWebPushSubscriptions, removeSubscription};
