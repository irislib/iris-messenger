import _ from 'lodash';
import Gun from 'gun';

import session from './session';
import util from './util';
import publicState from './public';
import privateState from './private';
import local from './local';
import group from './group';

const NOTIFICATION_SERVICE_URL = 'https://iris-notifications.herokuapp.com/notify';
// const notificationSound = new Audio('../../assets/audio/notification.mp3'); // TODO
let loginTime;
let unseenMsgsTotal = 0;
let unseenNotificationCount = 0;
const webPushSubscriptions = {};

function desktopNotificationsEnabled() {
  return window.Notification && Notification.permission === 'granted';
}

function notifyMsg(msg, info, channelId, onClick) {
  function shouldNotify() {
    if (msg.timeObj < loginTime) { return false; }
    if (info.selfAuthored) { return false; }
    if (document.visibilityState === 'visible') { return false; }
    const channel = privateState(channelId);
    if (channel.notificationSetting === 'nothing') { return false; }
    if (channel.notificationSetting === 'mentions' && !msg.text.includes(session.getMyName())) { return false; }
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
    //notificationSound.play(); // TODO
  }
  if (shouldDesktopNotify()) {
    let body, title;
    const channel = privateState(channelId);
    if (channel.uuid) {
      title = channel.participantProfiles[info.from].name;
      body = `${name}: ${msg.text}`;
    } else {
      title = 'Message'
      body = msg.text;
    }
    body = util.truncateString(body, 50);
    let desktopNotification = new Notification(title, { // TODO: replace with actual name
      icon: '/assets/img/icon128.png',
      body,
      silent: true
    });
    desktopNotification.onclick = function() {
      changeUnseenNotificationCount(-1);
      onClick && onClick();
      window.focus();
    };
  }
}

function changeChatUnseenMsgsCount(chatId, change) {
  const chat = privateState(chatId);
  if (!chat) return;
  const chatNode = local().get('channels').get(chatId);
  if (change) {
    unseenMsgsTotal += change;
    chat.unseen += change;
  } else {
    unseenMsgsTotal = unseenMsgsTotal - (chat.unseen || 0);
    chat.unseen = 0;
  }
  chatNode.get('unseen').put(chat.unseen);
  unseenMsgsTotal = unseenMsgsTotal >= 0 ? unseenMsgsTotal : 0;
  local().get('unseenMsgsTotal').put(unseenMsgsTotal);
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
  console.log('subscribing to web push', navigator.serviceWorker);
  if (!desktopNotificationsEnabled() || !navigator.serviceWorker) { return false; }
  await navigator.serviceWorker.ready;
  const reg = await navigator.serviceWorker.getRegistration();
  reg.active.postMessage({key: session.getKey()});
  const sub = await reg.pushManager.getSubscription();
  sub ? addWebPushSubscription(sub) : subscribe(reg);
}

const addWebPushSubscriptionsToChats = _.debounce(() => {
  const arr = Object.values(webPushSubscriptions);
  session.channelIds.forEach(channelId => {
    privateState(channelId).put('webPushSubscriptions', arr);
  });
}, 5000);

function removeSubscription(hash) {
  delete webPushSubscriptions[hash];
  publicState().user().get('webPushSubscriptions').get(hash).put(null);
  addWebPushSubscriptionsToChats();
}

async function addWebPushSubscription(s, saveToGun = true) {
  const myKey = session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  const enc = await Gun.SEA.encrypt(s, mySecret);
  const hash = await util.getHash(JSON.stringify(s));
  if (saveToGun) {
    publicState().user().get('webPushSubscriptions').get(hash).put(enc);
  }
  webPushSubscriptions[hash] = s;
  addWebPushSubscriptionsToChats();
}

async function getWebPushSubscriptions() {
  const myKey = session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  publicState().user().get('webPushSubscriptions').map().on(async enc => {
    if (!enc) { return; }
    const s = await Gun.SEA.decrypt(enc, mySecret);
    addWebPushSubscription(s, false);
  });
}

function getEpub(user) {
  return new Promise(resolve => {
    publicState().user(user).get('epub').on(async (epub,k,x,e) => {
      if (epub) {
        e.off();
        resolve(epub);
      }
    });
  });
}

async function getNotificationText(notification) {
  const profile = await publicState().user(notification.from).get('profile').once();
  const name = (profile && profile.name) || 'someone';
  const event = notification.event || notification.action;
  let eventText;
  if (event === 'like') eventText = `${name} liked your post`;
  else if (event === 'reply') eventText = `${name} replied to your post`;
  else if (event === 'mention') eventText = `${name} mentioned you in their post`;
  else if (event === 'follow') eventText = `${name} started following you`;
  else eventText = `${name} sent you a notification: ${event}`;
  return eventText;
}

function subscribeToIrisNotifications(onClick) {
  let notificationsSeenTime;
  let notificationsShownTime;
  publicState().user().get('notificationsSeenTime').on(v => {
    notificationsSeenTime = v;
    console.log(v);
  });
  publicState().user().get('notificationsShownTime').on(v => notificationsShownTime = v);
  const setNotificationsShownTime = _.debounce(() => {
    publicState().user().get('notificationsShownTime').put(new Date().toISOString());
  }, 1000);
  const alreadyHave = new Set();
  group().on(`notifications/${session.getPubKey()}`, async (encryptedNotification, k, x, e, from) => {
      const id = from.slice(0,30) + encryptedNotification.slice(0,30);
      if (alreadyHave.has(id)) { return; }
      alreadyHave.add(id);
      const epub = await getEpub(from);
      const secret = await Gun.SEA.secret(epub, session.getKey());
      const notification = await Gun.SEA.decrypt(encryptedNotification, secret);
      if (!notification || typeof notification !== 'object') { return; }
      setNotificationsShownTime();
      notification.from = from;
      local().get('notifications').get(notification.time).put(notification);
      if (!notificationsSeenTime || (notificationsSeenTime < notification.time)) {
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
          onClick && onClick(link);
          changeUnseenNotificationCount(-1);
          window.focus();
        };
      }
    });
}

function changeUnseenNotificationCount(change) {
  if (!change) {
    unseenNotificationCount = 0;
    publicState().user().get('notificationsSeenTime').put(new Date().toISOString());
  } else {
    unseenNotificationCount += change;
    unseenNotificationCount = Math.max(unseenNotificationCount, 0);
  }
  local().get('unseenNotificationCount').put(unseenNotificationCount);
}

async function sendIrisNotification(recipient, notification) {
  if (!(recipient && notification)) { return; } // TODO: use typescript or sth :D
  if (typeof notification === 'object') { notification.time = new Date().toISOString() }
  const epub = await getEpub(recipient);
  const secret = await Gun.SEA.secret(epub, session.getKey());
  const enc = await Gun.SEA.encrypt(notification, secret);
  publicState().user().get('notifications').get(recipient).put(enc);
}

async function sendWebPushNotification(recipient, notification) {
  console.log('sending web push notification to', recipient, notification);
  const channel = privateState(recipient);
  const myKey = session.getKey();
  const shouldWebPush = (recipient === myKey.pub) || !(channel.activity && channel.activity.isActive);
  if (shouldWebPush && channel.webPushSubscriptions) {
    const subscriptions = [];
    const participants = Object.keys(channel.webPushSubscriptions);
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const secret = await channel.getSecret(participant);
      const payload = {
        title: await Gun.SEA.encrypt(notification.title, secret),
        body: await Gun.SEA.encrypt(notification.body, secret),
        from:{pub: myKey.pub, epub: myKey.epub}
      };
      channel.webPushSubscriptions[participant].forEach(s => {
        if (s && s.endpoint) {
          subscriptions.push({subscription: s, payload});
        }
      });
    }
    if (subscriptions.length === 0) {return;}
    fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      body: JSON.stringify({subscriptions}),
      headers: {
        'content-type': 'application/json'
      }
    }).catch(() => {});
  }
}

function init() {
  loginTime = new Date();
  unseenMsgsTotal = 0;
}

export default {init, notifyMsg, getNotificationText, sendWebPushNotification, changeUnseenNotificationCount, subscribeToIrisNotifications, sendIrisNotification, changeChatUnseenCount: changeChatUnseenMsgsCount, webPushSubscriptions, subscribeToWebPush, getWebPushSubscriptions, removeSubscription};
