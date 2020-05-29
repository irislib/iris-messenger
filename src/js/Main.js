import { html, render } from './lib/htm.preact.js';
import Translation, {translate as t} from './Translation.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import Gallery from './Gallery.js';
import Session from './Session.js';
import Settings, {init as initSettings} from './Settings.js';
import Chat, {chats, init as initChat} from './Chat.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

Gun.log.off = true;
var gunOpts = { peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity };
if (!iris.util.isElectron) {
  gunOpts.store = RindexedDB(gunOpts);
}
var gun = Gun(gunOpts);
window.gun = gun;

Helpers.checkColorScheme();

var activeChat;
var activeProfile;

const Main = html`
  <div id="main-content">
    <section id="login" class="hidden">
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
          <p><a href="#" id="show-create-account">&lt; ${t('back')}</a></p>
          <input id="paste-privkey" placeholder="${t('paste_private_key')}"/>
          <p>
            <button id="scan-privkey-btn">${t('scan_private_key_qr_code')}</button>
          </p>
          <p>
            <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;" class="hidden"></video>
          </p>
        </div>
      </div>
    </section>

    <section class="sidebar hidden-xs">
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
        <div id="welcome" class="visible-xs-block">
          <h3>Iris Messenger</h3>
          <img src="img/icon128.png" width="64" height="64" alt="iris it is"/>
        </div>
      </div>
    </section>

    <section class="main">
      <header>
        <div id="back-button" class="visible-xs-inline-block">
          ‹
          <span class="unseen unseen-total"></span>
        </div>
        <div id="header-content"></div>
      </header>

      <!-- Chat view -->
      <${Chat}/>

      <!-- New chat view -->
      <div class="main-view" id="new-chat">
        <h3>${t('have_someones_chat_link')}</h3>
        <input id="paste-chat-link" type="text" placeholder="${t('paste_their_chat_link')}"/>
        <button id="scan-chatlink-qr-btn">${t('or_scan_qr_code')}</button>
        <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
        <h3>${t('give_your_chat_link')}</h3>
        <button class="copy-chat-link">${t('copy_your_chat_link')}</button>
        <button id="show-my-qr-btn">${t('or_show_qr_code')}</button>
        <p id="my-qr-code" class="qr-container" style="display:none"></p>
        <p><small>${t('beware_of_sharing_chat_link_publicly')}</small></p>
        <h3>${t('new_group')}</h3>
        <p>
          <input id="new-group-name" type="text" placeholder="${t('group_name')}"/>
          <button id="new-group-create">${t('create')}</button>
        </p>
        <hr/>
        <h3>${t('your_chat_links')}</h3>
        <p><button id="generate-chat-link">${t('create_new_chat_link')}</button></p>
        <div id="my-chat-links" class="flex-table"></div>
      </div>

      <!-- Settings view -->
      <${Settings}/>

      <!-- Logout confirmation -->
      <div class="main-view" id="logout-confirmation">
        <p>
          ${t('logout_confirmation_info')}
        </p>
        <p>
          <button class="open-settings-button">${t('back')}</button>
        </p>
        <p>
          <button class="logout-button">${t('log_out')}</button>
        </p>
      </div>


      <!-- Profile view -->
      <div class="main-view" id="profile">
        <div class="profile-photo-container">
        <img class="profile-photo"/></div>
        <div class="content">
          <div id="profile-group-settings">
            <div id="profile-group-name-container">${t('group_name')}: <input id="profile-group-name" placeholder="${t('group_name')}"/></div>
            <p>${t('participants')}:</p>
            <div id="profile-group-participants"></div>
            <div id="profile-add-participant" style="display:none;">
              <p>${t('add_participant')}:</p>
              <p><input id="profile-add-participant-input" type="text" style="width: 220px" placeholder="${t('new_participants_chat_link')}"/></p>
              <p><small>Currently you need to add each member here. After that, they can join using the group link ("copy link" below). "Join links" upcoming!</small></p>
            </div>
            <hr/>
          </div>
          <div class="profile-about" style="display:none">
            <p class="profile-about-content"></p>
          </div>
          <p class="status"></p>
          <p class="last-active"></p>
          <!--
          <p>
            <button class="add-friend">${t('add_friend')}</button>
          </p>
          <p>
            <small>Friends can optionally direct connect to each other and store each others' encrypted data.</small>
          </p>
        -->
          <p>
            <button class="send-message">${t('send_message')}</button>
            <button class="copy-user-link">${t('copy_link')}</button>
          </p>
          <p id="profile-page-qr" class="qr-container"></p>
          <hr/>
          <h3>${t('chat_settings')}</h3>
          <div class="profile-nicknames">
            <h4>${t('nicknames')}</h4>
            <p>
              ${t('nickname')}: <input id="profile-nickname-their"/>
            </p>
            <p id="profile-nickname-my-container">
              ${t('their_nickname_for_you')}: <span id="profile-nickname-my"></span>
            </p>
          </div>
          <div class="notification-settings">
            <h4>${t('notifications')}</h4>
            <input type="radio" id="notifyAll" name="notificationPreference" value="all"/>
            <label for="notifyAll">${t('all_messages')}</label><br/>
            <input type="radio" id="notifyMentionsOnly" name="notificationPreference" value="mentions"/>
            <label for="notifyMentionsOnly">${t('mentions_only')}</label><br/>
            <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing"/>
            <label for="notifyNothing">${t('nothing')}</label><br/>
          </div>
          <hr/>
          <p>
            <button class="delete-chat">${t('delete_chat')}</button>
            <!-- <button class="block-user">${t('block_user')}</button> -->
          </p>
        </div>
      </div>
    </section>
  </div>
`;

render(Main, document.body);

Session.init();
PeerManager.init();
Gallery.init();
initSettings();
initChat();
Translation.init();
Profile.init();
VideoCall.init();

$(window).load(() => {
  $('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails
});

Helpers.showConsoleWarning();

var emojiButton = $('#emoji-picker');
if (!iris.util.isMobile) {
  emojiButton.show();
  var picker = new EmojiButton({position: 'top-start'});

  picker.on('emoji', emoji => {
    $('#new-msg').val($('#new-msg').val() + emoji);
    $('#new-msg').focus();
  });

  emojiButton.click(event => {
    event.preventDefault();
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
  });
}

$('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

function resetView() {
  if (activeChat) {
    chats[activeChat].setTyping(false);
  }
  activeChat = null;
  activeProfile = null;
  showMenu(false);
  QRScanner.cleanupScanner();
  $('#chatlink-qr-video').hide();
  $('.chat-item').toggleClass('active', false);
  $('.main-view').hide();
  $('#not-seen-by-them').hide();
  $(".message-form").hide();
  $("#header-content").empty();
  $("#header-content").css({cursor: null});
  $('#private-key-qr').remove();
  Gallery.reset();
}

function showMenu(show = true) {
  $('.sidebar').toggleClass('hidden-xs', !show);
  $('.main').toggleClass('hidden-xs', show);
}
$('#back-button').off().on('click', () => {
  resetView();
  showMenu(true);
});

function setActiveChat(pub) {
  activeChat = pub;
}

function setActiveProfile(pub) {
  activeProfile = pub;
}

export {gun, showMenu, setActiveChat, activeChat, setActiveProfile, activeProfile, resetView};
