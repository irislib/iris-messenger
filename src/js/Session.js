import {publicState, activeRoute, activeProfile, resetView, showMenu} from './Main.js';
import {chats, addChat, showNewChat, newChat, showChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import Profile from './components/Profile.js';
import QRScanner from './QRScanner.js';
import { translate as tr } from './Translation.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let areWeOnline;

function newUserLogin() {
  $('#login').show();
  $('#login-form-name').focus();
  $('#login-form').submit(function(e) {
    e.preventDefault();
    var name = $('#login-form-name').val();
    if (name.length) {
      $('#login').hide();
      Gun.SEA.pair().then(k => {
        login(k);
        publicState.user().get('profile').get('name').put(name);
        createChatLink();
      });
    }
  });
}

function setOurOnlineStatus() {
  iris.Channel.setOnline(publicState, areWeOnline = true);
  document.addEventListener("mousemove", () => {
    if (!areWeOnline && activeRoute) {
      chats[activeRoute].setMyMsgsLastSeenTime();
    }
    iris.Channel.setOnline(publicState, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setOnline(publicState, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setOnline(publicState, areWeOnline = true);
      if (activeRoute && chats[activeRoute]) {
        chats[activeRoute].setMyMsgsLastSeenTime();
        Notifications.changeChatUnseenCount(activeRoute, 0);
      }
    } else {
      iris.Channel.setOnline(publicState, areWeOnline = false);
    }
  });
}

function login(k) {
  key = k;
  localStorage.setItem('chatKeyPair', JSON.stringify(k));
  $('#login').hide();
  iris.Channel.initUser(publicState, key);
  Notifications.subscribeToWebPush();
  Notifications.getWebPushSubscriptions();
  $('#my-chat-links').empty();
  iris.Channel.getMyChatLinks(publicState, key, undefined, chatLink => {
    const row = $('<div>').addClass('flex-row');
    const copyBtn = $('<button>').text(tr('copy')).width(100);
    copyBtn.on('click', event => {
      Helpers.copyToClipboard(chatLink.url);
      var t = $(event.target);
      var originalText = t.text();
      t.text(tr('copied'));
      setTimeout(() => {
        t.text(originalText);
      }, 2000);
    });
    const copyDiv = $('<div>').addClass('flex-cell no-flex').append(copyBtn);
    row.append(copyDiv);
    const input = $('<input>').attr('type', 'text').val(chatLink.url);
    input.on('click', () => input.select());
    row.append($('<div>').addClass('flex-cell').append(input));
    const removeBtn = $('<button>').text(tr('remove'));
    row.append($('<div>').addClass('flex-cell no-flex').append(removeBtn));
    $('#my-chat-links').append(row);
    setChatLinkQrCode(chatLink.url);
    latestChatLink = chatLink.url;
  });
  $('#generate-chat-link').off().on('click', createChatLink);
  $("#my-identicon").empty();
  $("#my-identicon").append(Helpers.getIdenticon(key.pub, 40));
  $(".profile-link").attr('href', Helpers.getUserChatLink(key.pub)).off().on('click', e => {
    e.preventDefault();
    if (chats[key.pub]) {
      Profile.showProfile(key.pub);
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
    } else {
      showNewChat();
    }
  }
  $('.user-info .user-name').text('anonymous');
  $('#settings-name').val('');
  Helpers.setImgSrc($('#current-profile-photo'), '');
  $('#private-key-qr').remove();
  publicState.user().get('profile').get('name').on(name => {
    if (name && typeof name === 'string') {
      myName = name;
      $('.user-info .user-name').text(Helpers.truncateString(name, 20));
      $('#settings-name').not(':focus').val(name);
    }
  });
  publicState.user().get('profile').get('about').on(about => {
    $('#settings-about').not(':focus').val(about || '');
  });
  publicState.user().get('profile').get('photo').on(data => {
    myProfilePhoto = data;
    if (!activeProfile) {
      Helpers.setImgSrc($('#current-profile-photo'), data);
      $('#add-profile-photo').toggleClass('hidden', true);
    }
  });
  setChatLinkQrCode();
  Notifications.init();
}

async function createChatLink() {
  latestChatLink = await iris.Channel.createChatLink(publicState, key);
  setChatLinkQrCode(latestChatLink);
}

function setChatLinkQrCode(link) {
  var qrCodeEl = $('#my-qr-code');
  qrCodeEl.empty();
  new QRCode(qrCodeEl[0], {
    text: link || getMyChatLink(),
    width: 320,
    height: 320,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

function clearIndexedDB() {
  window.indexedDB.deleteDatabase('localState');
  window.indexedDB.deleteDatabase('radata');
}

function getMyChatLink() {
  return latestChatLink || Helpers.getUserChatLink(key.pub);
}

function showSwitchAccount(e) {
  e.preventDefault();
  resetView();
  $('#create-account').hide();
  $('#existing-account-login').show();
  $('#paste-privkey').focus();
}

function showCreateAccount(e) {
  e.preventDefault();
  $('#privkey-qr-video').hide();
  $('#create-account').show();
  $('#existing-account-login').hide();
  QRScanner.cleanupScanner();
  $('#login-form-name').focus();
}

function copyMyChatLinkClicked(e) {
  Helpers.copyToClipboard(getMyChatLink());
  var te = $(e.target);
  var originalText = te.text();
  var originalWidth = te.width();
  te.width(originalWidth);
  te.text(tr('copied'));
  setTimeout(() => {
    te.text(originalText);
    te.css('width', '');
  }, 2000);
}

function showScanPrivKey() {
  if ($('#privkey-qr-video:visible').length) {
    $('#privkey-qr-video').hide();
    QRScanner.cleanupScanner();
  } else {
    $('#privkey-qr-video').show();
    QRScanner.startPrivKeyQRScanner().then(login);
  }
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
  $('#login').hide();
  var localStorageKey = localStorage.getItem('chatKeyPair');
  if (localStorageKey) {
    login(JSON.parse(localStorageKey));
  } else {
    newUserLogin();
  }

  $('#existing-account-login input').on('input', (event) => {
    var val = $(event.target).val();
    if (!val.length) { return; }
    try {
      var k = JSON.parse(val);
      login(k);
      $(event.target).val('');
    } catch (e) {
      console.error('Login with key', val, 'failed:', e);
    }
  });

  $('#show-existing-account-login').click(showSwitchAccount);
  $('#show-create-account').click(showCreateAccount);
  $('#scan-privkey-btn').click(showScanPrivKey);
}

export default {init, getKey, getMyName, getMyProfilePhoto, getMyChatLink, areWeOnline, copyMyChatLinkClicked, logOut };
