import Helpers from './Helpers.js';
import Profile from './Profile.js';
import Session from './Session.js';
import {chats, showChat} from './Chat.js';
import {publicState} from './Main.js';
import { translate as t } from './Translation.js';

var notificationSound = new Audio('../../audio/notification.mp3');
var loginTime;
var unseenTotal;
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
    if (msg.time < loginTime) { return false; }
    if (info.selfAuthored) { return false; }
    if (document.visibilityState === 'visible') { return false; }
    if (chats[pub].notificationSetting === 'nothing') { return false; }
    if (chats[pub].notificationSetting === 'mentions' && !msg.text.includes(Session.getMyName())) { return false; }
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
    var body = chats[pub].uuid ? `${chats[pub].participantProfiles[info.from].name}: ${msg.text}` : msg.text;
    body = Helpers.truncateString(body, 50);
    var desktopNotification = new Notification(Profile.getDisplayName(pub), {
      icon: 'img/icon128.png',
      body,
      silent: true
    });
    desktopNotification.onclick = function() {
      showChat(pub);
      window.focus();
    };
  }
}

var initialTitle = document.title;
function setUnseenTotal() {
  if (unseenTotal) {
    document.title = '(' + unseenTotal + ') ' + initialTitle;
    $('.unseen-total').text(unseenTotal).show();
  } else {
    document.title = initialTitle;
    $('.unseen-total').hide();
  }
}

function changeChatUnseenCount(pub, change) {
  if (change) {
    unseenTotal += change;
    chats[pub].unseen += change;
  } else {
    unseenTotal = unseenTotal - (chats[pub].unseen || 0);
    chats[pub].unseen = 0;
  }
  unseenTotal = unseenTotal >= 0 ? unseenTotal : 0;
  var chatListEl = $('.chat-item[data-pub="' + pub +'"]');
  var unseenCountEl = chatListEl.find('.unseen');
  if (chats[pub].unseen > 0) {
    chatListEl.addClass('has-unseen');
    unseenCountEl.text(chats[pub].unseen);
    unseenCountEl.show();
  } else {
    chatListEl.removeClass('has-unseen');
    unseenCountEl.hide();
  }
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
  if (!desktopNotificationsEnabled()) { return false; }
  await navigator.serviceWorker.ready;
  const reg = await navigator.serviceWorker.getRegistration();
  reg.active.postMessage({key: Session.getKey()});
  const sub = await reg.pushManager.getSubscription();
  sub ? addWebPushSubscription(sub) : subscribe(reg);
}

const addWebPushSubscriptionsToChats = _.debounce(() => {
  const arr = Object.values(webPushSubscriptions);
  Object.values(chats).forEach(chat => {
    if (chat.put) {
      chat.put('webPushSubscriptions', arr);
    }
  });
}, 5000);

function addWebPushSubscriptionsToSettings() {
  const el = $('#web-push-subscriptions');
  el.empty();
  const arr = Object.keys(webPushSubscriptions);
  arr.forEach(k => {
    const v = webPushSubscriptions[k];
    const row = $('<div>').addClass('flex-row');
    row.append($('<div>').addClass('flex-cell').text(v.endpoint));
    const btnContainer = $('<div>').addClass('flex-cell no-flex');
    const removeBtn = $('<button>').text(t('remove')).click(() => removeSubscription(k));
    btnContainer.append(removeBtn);
    row.append(btnContainer);
    el.append(row);
  });
}

const addWebPushSubscriptionsToSettingsDebounced = _.debounce(addWebPushSubscriptionsToSettings, 1000);

function removeSubscription(hash) {
  delete webPushSubscriptions[hash];
  publicState.user().get('webPushSubscriptions').get(hash).put(null);
  addWebPushSubscriptionsToSettings();
  addWebPushSubscriptionsToChats();
}

async function addWebPushSubscription(s, saveToGun = true) {
  const myKey = Session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  const enc = await Gun.SEA.encrypt(s, mySecret);
  const hash = await iris.util.getHash(JSON.stringify(s));
  if (saveToGun) {
    publicState.user().get('webPushSubscriptions').get(hash).put(enc);
  }
  webPushSubscriptions[hash] = s;
  addWebPushSubscriptionsToChats();
  addWebPushSubscriptionsToSettingsDebounced();
}

async function getWebPushSubscriptions() {
  const myKey = Session.getKey();
  const mySecret = await Gun.SEA.secret(myKey.epub, myKey);
  publicState.user().get('webPushSubscriptions').map().on(async enc => {
    if (!enc) { return; }
    const s = await Gun.SEA.decrypt(enc, mySecret);
    addWebPushSubscription(s, false);
  });
}

function init() {
  loginTime = new Date();
  unseenTotal = 0;
  if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    setTimeout(() => {
      $('#enable-notifications-prompt').slideDown();
    }, 5000);
  }
  $('#enable-notifications-prompt').click(enableDesktopNotifications);
}

export default {init, notifyMsg, changeChatUnseenCount, webPushSubscriptions, subscribeToWebPush, getWebPushSubscriptions, removeSubscription};
