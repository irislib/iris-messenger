import { html, useState, Component } from './lib/htm.preact.js';
import {localState, publicState, activeChat, activeProfile, resetView, showMenu} from './Main.js';
import {chats, addChat, showNewChat, newChat, showChat} from './Chat.js';
import Notifications from './Notifications.js';
import Helpers from './Helpers.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import { translate as tr } from './Translation.js';

let key;
let myName;
let myProfilePhoto;
let latestChatLink;
let onlineTimeout;
let areWeOnline;

const Login = () => html`<section id="login" class="hidden">
  <div id="login-content">
    <form id="login-form" autocomplete="off">
      <div id="create-account">
        <img style="width: 86px" src="img/android-chrome-192x192.png" alt="Iris"/>
        <h1>${tr('iris_messenger')}</h1>
        <input autofocus autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off" id="login-form-name" type="text" name="name" placeholder="${tr('whats_your_name')}"/>
        <p><button id="sign-up" type="submit">${tr('new_user_go')}</button></p>
        <br/>
        <p><a href="#" id="show-existing-account-login">${tr('already_have_an_account')}</a></p>
        <p>
          <svg width="14" height="14" style="margin-bottom: -1px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 469.333 469.333" style="enable-background:new 0 0 469.333 469.333;" xml:space="preserve"><path fill="currentColor" d="M253.227,300.267L253.227,300.267L199.04,246.72l0.64-0.64c37.12-41.387,63.573-88.96,79.147-139.307h62.507V64H192 V21.333h-42.667V64H0v42.453h238.293c-14.4,41.173-36.907,80.213-67.627,114.347c-19.84-22.08-36.267-46.08-49.28-71.467H78.72 c15.573,34.773,36.907,67.627,63.573,97.28l-108.48,107.2L64,384l106.667-106.667l66.347,66.347L253.227,300.267z"/><path fill="currentColor" d="M373.333,192h-42.667l-96,256h42.667l24-64h101.333l24,64h42.667L373.333,192z M317.333,341.333L352,248.853 l34.667,92.48H317.333z"/></svg>
          <select class="language-selector"></select>
        </p>
      </div>
    </form>
    <div id="existing-account-login" class="hidden">
      <p><a href="#" id="show-create-account">> ${tr('back')}</a></p>
      <input id="paste-privkey" placeholder="${tr('paste_private_key')}"/>
      <p>
        <button id="scan-privkey-btn">${tr('scan_private_key_qr_code')}</button>
      </p>
      <p>
        <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;" class="hidden"></video>
      </p>
    </div>
  </div>
</section>`;

class Identicon extends Component {
  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    const i = Helpers.getIdenticon(this.props.str, this.props.width)[0];
    this.base.appendChild(i);
  }

  render() {
    return html`<div class="identicon-container"/>`;
  }
}

const ChatListItem = (props) => {
  const [name, setName] = useState('');
  localState.get('chats').get(props.chatId).get('name').on(n => setName(n));
  const [latestText, setLatestText] = useState('');
  localState.get('chats').get(props.chatId).get('latest').get('text').on(l => setLatestText(l));
  const [latestTime, setLatestTime] = useState('');
  localState.get('chats').get(props.chatId).get('latest').get('time').on(t => setLatestTime(t));
  return html`
  <div class="chat-item" onClick=${() => showChat(props.chatId)}>
    <${Identicon} str=${props.chatId} width=49/>
    <div class="text">
      <div>
        <span class="name">${name}</span>
        <small class="latest-time">${latestTime}</small>
      </div>
      <small class="typing-indicator">${tr('typing')}</small>
      <small class="latest">${latestText}</small>
      <span class="unseen"></span>
    </div>
  </div>
  `;
};

const SideBar = () => {
  const [chatIds, setChatIds] = useState([]);
  localState.get('chats').map().on((v, id) => {
    if (chatIds.indexOf(id) === -1) {
      const a = [].concat(chatIds);
      a.push(id);
      setChatIds(a);
    }
  });
  return html`<section class="sidebar hidden-xs">
    <div class="user-info">
      <div id="my-identicon"></div>
      <div class="user-name"></div>
    </div>
    <div id="enable-notifications-prompt">
      <div class="title">${tr('get_notified_new_messages')}</div>
      <div><a>${tr('turn_on_desktop_notifications')}</a></div>
    </div>
    <div class="chat-list">
    <div class="chat-item public-messages" data-pub="public">
      <svg
       viewBox="0 -256 1792 1792"
       width="18"
       height="18" style="margin-right: 10px">
      <g
         transform="matrix(1,0,0,-1,136.67797,1300.6102)"
         id="g3027">
        <path
           d="m 1193,993 q 11,7 25,22 v -1 q 0,-2 -9.5,-10 -9.5,-8 -11.5,-12 -1,1 -4,1 z m -6,-1 q -1,1 -2.5,3 -1.5,2 -1.5,3 3,-2 10,-5 -6,-4 -6,-1 z m -459,183 q -16,2 -26,5 1,0 6.5,-1 5.5,-1 10.5,-2 5,-1 9,-2 z m 45,37 q 7,4 13.5,2.5 6.5,-1.5 7.5,-7.5 -5,3 -21,5 z m -8,-6 -3,2 q -2,3 -5.5,5 -3.5,2 -4.5,2 2,-1 21,-3 -6,-4 -8,-6 z m -102,84 v 2 q 1,-2 3,-5.5 2,-3.5 3,-5.5 z m -105,-40 q 0,-2 -1,-2 l -1,2 h 2 z M 933,206 v -1 1 z M 768,1408 q 209,0 385.5,-103 Q 1330,1202 1433,1025.5 1536,849 1536,640 1536,431 1433,254.5 1330,78 1153.5,-25 977,-128 768,-128 559,-128 382.5,-25 206,78 103,254.5 0,431 0,640 0,849 103,1025.5 206,1202 382.5,1305 559,1408 768,1408 z m 472,-1246 5,5 q -7,10 -29,12 1,12 -14,26.5 -15,14.5 -27,15.5 0,4 -10.5,11 -10.5,7 -17.5,8 -9,2 -27,-9 -7,-3 -4,-5 -3,3 -12,11 -9,8 -16,11 -2,1 -7.5,1 -5.5,0 -8.5,2 -1,1 -6,4.5 -5,3.5 -7,4.5 -2,1 -6.5,3 -4.5,2 -7.5,1.5 -3,-0.5 -7.5,-2.5 -4.5,-2 -8.5,-6 -4,-4 -4.5,-15.5 -0.5,-11.5 -2.5,-14.5 -8,6 -0.5,20 7.5,14 1.5,20 -7,7 -21,0.5 -14,-6.5 -21,-15.5 -1,-1 -9.5,-5.5 Q 963,241 960,238 q -4,-6 -9,-17.5 -5,-11.5 -6,-13.5 0,2 -2.5,6.5 -2.5,4.5 -2.5,6.5 -12,-2 -16,3 5,-16 8,-17 l -4,2 q -1,-6 3,-15 4,-9 4,-11 1,-5 -1.5,-13 -2.5,-8 -2.5,-11 0,-2 5,-11 4,-19 -2,-32 0,-1 -3.5,-7 -3.5,-6 -6.5,-11 l -2,-5 -2,1 q -1,1 -2,0 -1,-6 -9,-13 -8,-7 -10,-11 -15,-23 -9,-38 3,-8 10,-10 3,-1 3,2 1,-9 -11,-27 1,-1 4,-3 -17,0 -10,-14 202,36 352,181 h -3 z M 680,347 q 16,3 30.5,-16 14.5,-19 22.5,-23 41,-20 59,-11 0,-9 14,-28 3,-4 6.5,-11.5 3.5,-7.5 5.5,-10.5 5,-7 19,-16 14,-9 19,-16 6,3 9,9 13,-35 24,-34 5,0 8,8 0,-1 -0.5,-3 -0.5,-2 -1.5,-3 7,15 5,26 l 6,4 q 5,4 5,5 -6,6 -9,-3 -30,-14 -48,22 -2,3 -4.5,8 -2.5,5 -5,12 -2.5,7 -1.5,11.5 1,4.5 6,4.5 11,0 12.5,1.5 1.5,1.5 -2.5,6 -4,4.5 -4,7.5 -1,4 -1.5,12.5 Q 853,318 852,322 l -5,6 q -5,6 -11.5,13.5 -6.5,7.5 -7.5,9.5 -4,-10 -16.5,-8.5 -12.5,1.5 -18.5,9.5 1,-2 -0.5,-6.5 -1.5,-4.5 -1.5,-6.5 -14,0 -17,1 1,6 3,21 2,15 4,22 1,5 5.5,13.5 4.5,8.5 8,15.5 3.5,7 4.5,14 1,7 -4.5,10.5 -5.5,3.5 -18.5,2.5 -20,-1 -29,-22 -1,-3 -3,-11.5 -2,-8.5 -5,-12.5 -3,-4 -9,-7 -8,-3 -27,-2 -19,1 -26,5 -14,8 -24,30.5 -10,22.5 -11,41.5 0,10 3,27.5 3,17.5 3,27 0,9.5 -6,26.5 3,2 10,10.5 7,8.5 11,11.5 2,2 5,2 h 5 q 0,0 4,2 4,2 3,6 -1,1 -4,3 -3,3 -4,3 4,-3 19,-1 15,2 19,2 0,1 22,0 17,-13 24,2 0,1 -2.5,10.5 -2.5,9.5 -0.5,14.5 5,-29 32,-10 3,-4 16.5,-6 13.5,-2 18.5,-5 3,-2 7,-5.5 4,-3.5 6,-5 2,-1.5 6,-0.5 4,1 9,7 11,-17 13,-25 11,-43 20,-48 8,-2 12.5,-2 4.5,0 5,10.5 0.5,10.5 0,15.5 -0.5,5 -1.5,13 l -2,37 q -16,3 -20,12.5 -4,9.5 1.5,20 5.5,10.5 16.5,19.5 1,1 16.5,8 15.5,7 21.5,12 24,19 17,39 9,-2 11,9 l -5,3 q -4,3 -8,5.5 -4,2.5 -5,1.5 11,7 2,18 5,3 8,11.5 3,8.5 9,11.5 9,-14 22,-3 8,9 2,18 5,8 22,11.5 17,3.5 20,9.5 5,-1 7,0 2,1 2,4.5 v 7.5 q 0,0 1,8.5 1,8.5 3,7.5 4,6 16,10.5 12,4.5 14,5.5 l 19,12 q 4,4 0,4 18,-2 32,11 13,12 -5,23 2,7 -4,10.5 -6,3.5 -16,5.5 3,1 12,0.5 9,-0.5 12,1.5 15,11 -7,17 -20,5 -47,-13 -3,-2 -13,-12 -10,-10 -17,-11 15,18 5,22 8,-1 22.5,9 14.5,10 15.5,11 4,2 10.5,2.5 6.5,0.5 8.5,1.5 71,25 92,-1 8,11 11,15 3,4 9.5,9 6.5,5 15.5,8 21,7 23,9 l 1,23 q -12,-1 -18,8 -6,9 -7,22 l -6,-8 q 0,6 -3.5,7.5 -3.5,1.5 -7.5,0.5 -4,-1 -9.5,-2 -5.5,-1 -7.5,0 -9,2 -19.5,15.5 -10.5,13.5 -14.5,16.5 9,0 9,5 -2,5 -10,8 1,6 -2,8 -3,2 -9,0 -2,12 -1,13 -6,1 -11,11 -5,10 -8,10 -2,0 -4.5,-2 -2.5,-2 -5,-5.5 l -5,-7 q 0,0 -3.5,-5.5 l -2,-2 q -12,6 -24,-10 -9,1 -17,-2 15,6 2,13 -11,5 -21,2 12,5 10,14 -2,9 -12,16 1,0 4,-1 3,-1 4,-1 -1,5 -9.5,9.5 -8.5,4.5 -19.5,9 -11,4.5 -14,6.5 -7,5 -36,10.5 -29,5.5 -36,1.5 -5,-3 -6,-6 -1,-3 1.5,-8.5 2.5,-5.5 3.5,-8.5 6,-23 5,-27 -1,-3 -8.5,-8 -7.5,-5 -5.5,-12 1,-4 11.5,-10 10.5,-6 12.5,-12 5,-13 -4,-25 -4,-5 -15,-11 -11,-6 -14,-10 -5,-5 -3.5,-11.5 1.5,-6.5 0.5,-9.5 1,1 1,2.5 0,1.5 1,2.5 0,-13 11,-22 8,-6 -16,-18 -20,-11 -20,-4 1,8 -7.5,16 -8.5,8 -10.5,12 -2,4 -3.5,19 -1.5,15 -9.5,21 -6,4 -19,4 -13,0 -18,-5 0,10 -49,30 -17,8 -58,4 7,1 0,17 -8,16 -21,12 -8,25 -4,35 2,5 9,14 7,9 9,15 1,3 15.5,6 14.5,3 16.5,8 1,4 -2.5,6.5 -3.5,2.5 -9.5,4.5 53,-6 63,18 5,9 3,14 0,-1 2,-1 2,0 2,-1 12,3 7,17 19,8 26,8 5,-1 11,-6 6,-5 10,-5 17,-3 21.5,10 4.5,13 -9.5,23 7,-4 7,6 -1,13 -7,19 -3,2 -6.5,2.5 -3.5,0.5 -6.5,0 -3,-0.5 -7,0.5 -1,0 -8,2 -1,-1 -2,-1 h -8 q -4,-2 -4,-5 v -1 q -1,-3 4,-6 l 5,-1 3,-2 q -1,0 -2.5,-2.5 -1.5,-2.5 -2.5,-2.5 0,-3 3,-5 -2,-1 -14,-7.5 -12,-6.5 -17,-10.5 -1,-1 -4,-2.5 -3,-1.5 -4,-2.5 -2,-1 -4,2 -2,3 -4,9 -2,6 -4,11.5 -2,5.5 -4.5,10 -2.5,4.5 -5.5,4.5 -12,0 -18,-17 3,10 -13,17.5 -16,7.5 -25,7.5 20,15 -9,30 l -1,1 q -30,-4 -45,-7 -2,-6 3,-12 -1,-7 6,-9 0,-1 0.5,-1 0.5,0 0.5,-1 0,1 -0.5,1 -0.5,0 -0.5,1 3,-1 10.5,-1.5 7.5,-0.5 9.5,-1.5 3,-1 4.5,-2 l 7.5,-5 q 0,0 5.5,-6 5.5,-6 -2.5,-5 -2,-1 -9,-4 -7,-3 -12.5,-5.5 -5.5,-2.5 -6.5,-3.5 -3,-5 0,-16 3,-11 -2,-15 -5,5 -10,18.5 -5,13.5 -8,17.5 8,-9 -30,-6 l -8,1 q -4,0 -15,-2 -11,-2 -16,-1 -7,0 -29,6 7,17 5,25 5,0 7,2 l -6,3 q -3,-1 -25,-9 2,-3 8,-9.5 6,-6.5 9,-11.5 -22,6 -27,-2 0,-1 -9,0 -25,1 -24,-7 1,-4 9,-12 0,-9 -1,-9 -27,22 -30,23 -172,-83 -276,-248 1,-2 2.5,-11 1.5,-9 3.5,-8.5 2,0.5 11,4.5 9,-9 3,-21 2,2 36,-21 56,-40 22,-53 v 5.5 q 0,0 1,6.5 -9,-1 -19,5 -3,-6 0.5,-20 3.5,-14 11.5,-14 -8,0 -10.5,-17 Q 257,834 257,812.5 257,791 256,787 l 2,-1 q -3,-13 6,-37.5 9,-24.5 24,-20.5 -4,-18 5,-21 -1,-4 0,-8 1,-4 4.5,-8.5 3.5,-4.5 6,-7 l 7.5,-7.5 6,-6 q 28,-11 41,-29 4,-6 10.5,-24.5 Q 375,598 384,591 q -2,-6 10,-21.5 12,-15.5 11,-25.5 -1,0 -2.5,-0.5 -1.5,-0.5 -2.5,-0.5 3,-8 16.5,-16 13.5,-8 16.5,-14 2,-3 2.5,-10.5 0.5,-7.5 3,-12 2.5,-4.5 8.5,-2.5 3,24 -26,68 -16,27 -18,31 -3,5 -5.5,16.5 -2.5,11.5 -4.5,15.5 27,-9 26,-13 -5,-10 26,-52 2,-3 10,-10 8,-7 11,-12 3,-4 9.5,-14.5 Q 482,507 486,502 q -1,0 -3,-2 l -3,-3 q 4,-2 9,-5 5,-3 8,-4.5 3,-1.5 7.5,-5 4.5,-3.5 7.5,-7.5 16,-18 20,-33 1,-4 0.5,-15.5 Q 532,415 534,410 q 2,-6 6,-11 4,-5 11.5,-10 7.5,-5 11.5,-7 4,-2 14.5,-6.5 10.5,-4.5 11.5,-5.5 2,-1 18,-11 16,-10 25,-14 10,-4 16.5,-4.5 6.5,-0.5 16,2.5 9.5,3 15.5,4 z"
           id="path3029"
           inkscape:connector-curvature="0"
           style="fill:currentColor" />
      </g>
      </svg>
      ${tr('public_messages')}
      </div>
      <div class="chat-item new">
        <svg class="svg-inline--fa fa-smile fa-w-16" style="margin-right:10px;margin-top:3px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 510 510" xml:space="preserve">
          <path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"/>
        </svg>
        ${tr('new_chat')}
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

  $('.logout-button').click(async () => {
    // TODO: remove subscription from your chats
    localStorage.removeItem('chatKeyPair');
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
    _.defer(() => location.reload());
  });
  $('#show-existing-account-login').click(showSwitchAccount);
  $('#show-create-account').click(showCreateAccount);
  $('#scan-privkey-btn').click(showScanPrivKey);
}

export default {SideBar, Login, init, getKey, getMyName, getMyProfilePhoto, getMyChatLink, areWeOnline};
