import Helpers from '../Helpers.js';
import {chats} from '../components/Main.js';

var notificationSound = new Audio('../../audio/notification.mp3');
var loginTime;

function desktopNotificationsEnabled() {
  return window.Notification && Notification.permission === 'granted';
}

function enableDesktopNotifications() {
  if (window.Notification) {
    Notification.requestPermission((status) => {
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        $('#enable-notifications-prompt').slideUp();
      }
    });
  }
}
$('#enable-notifications-prompt').click(enableDesktopNotifications);

function notifyMsg(msg, info, pub) {
  function shouldNotify() {
    if (msg.time < loginTime) { return false; }
    if (info.selfAuthored) { return false; }
    if (document.visibilityState === 'visible') { return false; }
    if (chats[pub].notificationSetting === 'nothing') { return false; }
    if (chats[pub].notificationSetting === 'mentions' && !msg.text.includes(myName)) { return false; }
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
    var desktopNotification = new Notification(getDisplayName(pub), {
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

function init() {
  loginTime = new Date();
  if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    setTimeout(() => {
      $('#enable-notifications-prompt').slideDown();
    }, 5000);
  }
}

export default {init, notifyMsg};
