import { html } from '../lib/htm.preact.js';
import { translate as t } from '../Translation.js';
import { newChat, showChat, addChat } from '../Chat.js';
import { publicState } from '../Main.js';
import Helpers from '../Helpers.js';
import QRScanner from '../QRScanner.js';
import Profile from './Profile.js';
import Session from '../Session.js';

function createGroupSubmit(e) {
  e.preventDefault();
  if ($('#new-group-name').val().length) {
    var c = new iris.Channel({
      gun: publicState,
      key: Session.getKey(),
      participants: [],
    });
    c.put('name', $('#new-group-name').val());
    $('#new-group-name').val('');
    addChat(c);
    Profile.showProfile(c.uuid);
  }
}

function scanChatLinkQr() {
  if ($('#chatlink-qr-video:visible').length) {
    $('#chatlink-qr-video').hide();
    QRScanner.cleanupScanner();
  } else {
    $('#chatlink-qr-video').show();
    QRScanner.startChatLinkQRScanner();
  }
}

function onPasteChatLink(event) {
  var val = $(event.target).val();
  if (val.length < 30) {
    return;
  }
  var s = val.split('?');
  if (s.length !== 2) { return; }
  var chatId = Helpers.getUrlParameter('chatWith', s[1]) || Helpers.getUrlParameter('channelId', s[1]);
  if (chatId) {
    newChat(chatId, val);
    showChat(chatId);
  }
  $(event.target).val('');
}

const NewChat = () => html`
  <div class="main-view" id="new-chat">
    <h3>${t('have_someones_chat_link')}</h3>
    <input id="paste-chat-link" onInput=${e => onPasteChatLink(e)} type="text" placeholder="${t('paste_their_chat_link')}"/>
    <button id="scan-chatlink-qr-btn" onClick=${scanChatLinkQr}>${t('or_scan_qr_code')}</button>
    <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
    <h3>${t('give_your_chat_link')}</h3>
    <button onClick=${e => Session.copyMyChatLinkClicked(e)}>${t('copy_your_chat_link')}</button>
    <button id="show-my-qr-btn">${t('or_show_qr_code')}</button>
    <p id="my-qr-code" class="qr-container" style="display:none"></p>
    <p><small dangerouslySetInnerHTML=${{ __html: t('beware_of_sharing_chat_link_publicly') }}></small></p>
    <h3>${t('new_group')}</h3>
    <p>
      <form id="new-group-form" onSubmit=${e => createGroupSubmit(e)}>
        <input id="new-group-name" type="text" placeholder="${t('group_name')}"/>
        <button type="submit">${t('create')}</button>
      </form>
    </p>
    <hr/>
    <h3>${t('your_chat_links')}</h3>
    <p><button id="generate-chat-link">${t('create_new_chat_link')}</button></p>
    <div id="my-chat-links" class="flex-table"></div>
  </div>`;

export default NewChat;
