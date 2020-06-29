import { html, useState } from './lib/htm.preact.js';
import {localState, publicState, activeChat, activeProfile, resetView, showMenu} from './Main.js';
import {chats, addChat, showNewChat, newChat, showChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import { translate as t } from './Translation.js';

var key;
var myName;
var myProfilePhoto;
var latestChatLink;
var onlineTimeout;
var areWeOnline;

const Login = () => html`<section id="login" class="hidden">
  <div id="login-content">
    <form id="login-form" autocomplete="off">
      <div id="create-account">
        <img style="width: 86px" src="img/android-chrome-192x192.png" alt="Iris"/>
        <h1>${t('iris_messenger')}</h1>
        <input autofocus autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off" id="login-form-name" type="text" name="name" placeholder="${t('whats_your_name')}"/>
        <p><button id="sign-up" type="submit">${t('new_user_go')}</button></p>
        <br/>
        <p><a href="#" id="show-existing-account-login">${t('already_have_an_account')}</a></p>
        <p>
          <svg width="14" height="14" style="margin-bottom: -1px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 469.333 469.333" style="enable-background:new 0 0 469.333 469.333;" xml:space="preserve"><path fill="currentColor" d="M253.227,300.267L253.227,300.267L199.04,246.72l0.64-0.64c37.12-41.387,63.573-88.96,79.147-139.307h62.507V64H192 V21.333h-42.667V64H0v42.453h238.293c-14.4,41.173-36.907,80.213-67.627,114.347c-19.84-22.08-36.267-46.08-49.28-71.467H78.72 c15.573,34.773,36.907,67.627,63.573,97.28l-108.48,107.2L64,384l106.667-106.667l66.347,66.347L253.227,300.267z"/><path fill="currentColor" d="M373.333,192h-42.667l-96,256h42.667l24-64h101.333l24,64h42.667L373.333,192z M317.333,341.333L352,248.853 l34.667,92.48H317.333z"/></svg>
          <select class="language-selector"></select>
        </p>
      </div>
    </form>
    <div id="existing-account-login" class="hidden">
      <p><a href="#" id="show-create-account">> ${t('back')}</a></p>
      <input id="paste-privkey" placeholder="${t('paste_private_key')}"/>
      <p>
        <button id="scan-privkey-btn">${t('scan_private_key_qr_code')}</button>
      </p>
      <p>
        <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;" class="hidden"></video>
      </p>
    </div>
  </div>
</section>`;

const ChatListItem = (props) => {
  const [name, setName] = useState('');
  const chat = chats[props.chatId];
  console.log(props.chatId, chat, chats);
  if (chat && chat.uuid) {
    chat.on('name', n => setName(n));
  } else {
    publicState.user(props.chatId).get('profile').get('name').on(n => setName(n));
  }
  return html`
  <div class="chat-item" onClick=${() => showChat(props.chatId)}>
    <div class="text">
      <div>
        <span class="name">${name}</span><small class="latest-time"></small>
      </div>
      <small class="typing-indicator"></small> <small class="latest"></small>
      <span class="unseen"></span>
    </div>
  </div>
  `;
};

const SideBar = () => {
  const [chatIds, setChatIds] = useState([]);
  localState.get('chats').map().on((v, id) => {
    console.log(id);
    if (chatIds.indexOf(id) === -1) {
      chatIds.push(id);
      setChatIds(chatIds);
      console.log(chatIds);
    }
  });
  return html`<section class="sidebar hidden-xs">
    <div class="user-info">
      <div id="my-identicon"></div>
      <div class="user-name"></div>
    </div>
    <div id="enable-notifications-prompt">
      <div class="title">${t('get_notified_new_messages')}</div>
      <div><a>${t('turn_on_desktop_notifications')}</a></div>
    </div>
    <div class="chat-list">
      <div class="chat-item new">
        <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 510 510" xml:space="preserve">
          <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
        </svg>
        ${t('new_chat')}
      </div>
      ${chatIds.map(id => html`<${ChatListItem} chatId=${id}/>`)}
      <div id="welcome" class="visible-xs-block">
        <h3>Iris Messenger</h3>
        <img src="img/icon128.png" width="64" height="64" alt="iris it is"/>
      </div>
    </div>
  </section>`
};

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
    if (!areWeOnline && activeChat) {
      chats[activeChat].setMyMsgsLastSeenTime();
    }
    iris.Channel.setOnline(publicState, areWeOnline = true);
    clearTimeout(onlineTimeout);
    onlineTimeout = setTimeout(() => iris.Channel.setOnline(publicState, areWeOnline = false), 60000);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'visible') {
      iris.Channel.setOnline(publicState, areWeOnline = true);
      if (activeChat) {
        chats[activeChat].setMyMsgsLastSeenTime();
        Notifications.changeChatUnseenCount(activeChat, 0);
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
  $('#my-chat-links').empty();
  iris.Channel.getMyChatLinks(publicState, key, undefined, chatLink => {
    var row = $('<div>').addClass('flex-row');
    var text = $('<div>').addClass('flex-cell').text(chatLink.url);
    var btn = $('<button>Remove</button>').click(() => {
      iris.Channel.removeChatLink(publicState, key, chatLink.id);
      Helpers.hideAndRemove(row);
    });
    row.append(text);
    row.append($('<div>').addClass('flex-cell no-flex').append(btn));
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

  $('.logout-button').click(() => {
    localStorage.removeItem('chatKeyPair');
    location.reload(); // ensure that everything is reset (especially on the gun side). TODO: without reload
  });
  $('#show-existing-account-login').click(showSwitchAccount);
  $('#show-create-account').click(showCreateAccount);
  $('#scan-privkey-btn').click(showScanPrivKey);
}

export default {SideBar, Login, init, getKey, getMyName, getMyProfilePhoto, getMyChatLink, areWeOnline};
