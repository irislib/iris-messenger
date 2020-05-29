import { h, Component, render } from './lib/preact.module.js';
import htm from './lib/htm.module.js';
import Translation, {translate as t} from './Translation.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import Gallery from './Gallery.js';
import Session from './Session.js';
import Settings from './Settings.js';
import Chats, {chats} from './Chats.js';
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

const html = htm.bind(h);
const app = html`
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
      <div class="main-view" id="message-view">
        <div id="message-list"></div>
        <div id="attachment-preview" class="hidden"></div>
      </div>
      <div id="not-seen-by-them" style="display: none">
        <p>${t('if_other_person_doesnt_see_message')}</p>
        <p><button class="copy-chat-link">${t('copy_your_chat_link')}</button></p>
      </div>
      <div class="message-form" style="display:none">
        <form autocomplete="off">
          <input name="attachment-input" type="file" class="hidden" id="attachment-input" accept="image/*" multiple/>
          <button type="button" id="attach-file">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"/></svg>
          </button>
          <button type="button" id="emoji-picker">
            <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="smile" class="svg-inline--fa fa-smile fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"></path></svg>
          </button>
          <input id="new-msg" type="text" placeholder="${t('type_a_message')}" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off"/>
          <button type="submit">
            <svg class="svg-inline--fa fa-w-16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
          </button>
        </form>
      </div>

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
      <div class="main-view" id="settings">
        <h3>${t('profile')}</h3>
        <p>
          ${t('your_name')}:
        </p>
        <p>
          <input id="settings-name" placeholder="${t('your_name')}"/>
        </p>
        <p id="profile-photo-chapter">
          ${t('profile_photo')}:
        </p>
        <div id="profile-photo-settings">
          <img id="current-profile-photo"/>
          <button id="add-profile-photo">${t('add_profile_photo')}</button>
          <div id="profile-photo-preview-container">
            <img id="profile-photo-preview" class="hidden"/>
          </div>
          <p>
            <input name="profile-photo-input" type="file" class="hidden" id="profile-photo-input" accept="image/*"/>
          </p>
          <p id="profile-photo-error" class="hidden">${t('profile_photo_too_big')}</p>
          <p>
            <button id="cancel-profile-photo" class="hidden">${t('cancel')}</button>
            <button id="use-profile-photo" class="hidden">${t('use_photo')}</button>
            <button id="remove-profile-photo" class="hidden">${t('remove_photo')}</button>
          </p>
        </div>
        <p>${t('about_text')}:</p>
        <p>
          <input id="settings-about" style="width:100%" placeholder="${t('about_text')}"/>
        </p>
        <hr/>
        <h3>${t('account')}</h3>
        <p>
          <b>${t('save_backup_of_privkey_first')}</b> ${t('otherwise_cant_log_in_again')}
        </p>
        <p>
          <button class="show-logout-confirmation">${t('log_out')}</button>
        </p>
        <h4>${t('private_key')}</h4>
        <p>
          ${t('private_key_warning')}
        </p>
        <p>
          <button id="download-private-key">${t('download_private_key')}</button>
          <button id="copy-private-key">${t('copy_private_key')}</button>
        </p>
        <p>
          <button id="show-private-key-qr">${t('show_privkey_qr')}</button>
        </p>
        <p><small>${t('privkey_storage_recommendation')}</small></p>
        <hr/>
        <h3>${t('language')}</h3>
        <p><select class="language-selector"></select></p>
        <hr/>
        <h3>${t('peers')}</h3>
        <div id="peers" class="flex-table">
          <div class="flex-row" id="add-peer-row">
            <div class="flex-cell">
              <input type="url" id="add-peer-url" placeholder="${t('peer_url')}"/>
              <input type="checkbox" id="add-peer-public"/>
              <label for="add-peer-public">${t('public')}</label>
              <button id="add-peer-btn">${t('add')}</button>
            </div>
          </div>
          <p>
            <small>
              ${t('public_peer_info')}
            </small>
          </p>
          <p>
            <small>
              ${t('peers_info')}
            </small>
          </p>
        </div>
        <hr/>
        <h3>${t('webrtc_connection_options')}</h3>
        <p><small>${t('webrtc_info')}</small></p>
        <p><textarea rows="4" id="rtc-config" placeholder="${t('webrtc_connection_options')}"></textarea></p>
        <button id="restore-default-rtc-config">${t('restore_defaults')}</button>
        <hr/>
        <h3>${t('about')}</h3>
        <p>Iris is like the messaging apps we're used to, but better.</p>
        <ul>
          <li><b>No phone number or signup required.</b> Just start using it!</li>
          <li><b>Secure</b>: It's open source. Users can validate that big brother doesn't read your messages.</li>
          <li><b>Available</b>: It works offline-first and is not dependent on any single centrally managed server. Users can even connect directly to each other.</li>
        </ul>
        <p>Released under MIT license. Code: <a href="https://github.com/irislib/iris-messenger">Github</a>.</p>
        <p><small>Version 1.2.9</small></p>

        <div id="desktop-application-about">
          <h4>Get the desktop application</h4>
          <ul>
            <li>Communicate and synchronize with local network peers without Internet access
              <ul>
                <li>When local peers eventually connect to the Internet, your messages are relayed globally</li>
                <li>Bluetooth support upcoming</li>
              </ul>
            </li>
            <li>Opens to background on login: stay online and get message notifications</li>
            <li>More secure and available: no need to open the browser application from a server</li>
          </ul>
          <p><a href="https://github.com/irislib/iris-electron/releases">Download</a></p>
        </div>

        <h4>Privacy</h4>
        <p>Messages are end-to-end encrypted, but message timestamps and the number of chats aren't. In a decentralized network this information is potentially available to anyone.</p>
        <p>By looking at timestamps in chats, it is possible to guess who are chatting with each other. There are potential technical solutions to hiding the timestamps, but they are not implemented yet. It is also possible, if not trivial, to find out who are communicating with each other by monitoring data subscriptions on the decentralized database.</p>
        <p>In that regard, Iris prioritizes decentralization and availability over perfect privacy.</p>
        <p>Profile names, photos and online status are currently public. That can be changed when advanced group permissions are developed.</p>
        <p>${t('application_security_warning')}</p>

        <h4>Donate</h4>
        <p>${t('donate_info')}: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST</p>
      </div>

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

render(app, document.body);

Session.init();
PeerManager.init();
Gallery.init();
Settings.init();
Chats.init();
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
