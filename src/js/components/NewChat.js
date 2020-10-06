import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import { newChat, showChat, addChat, followChatLink } from '../Chat.js';
import { localState, publicState } from '../Main.js';
import Helpers from '../Helpers.js';
import QRScanner from '../QRScanner.js';
import Session from '../Session.js';
import CopyButton from './CopyButton.js';
import { Component } from '../lib/preact.js';
import { route } from '../lib/preact-router.es.js';

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
    route('/profile/' + c.uuid);
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
  followChatLink(val);
  $(event.target).val('');
}

function setChatLinkQrCode(link) {
  var qrCodeEl = $('#my-qr-code');
  if (qrCodeEl.length === 0) { return; }
  qrCodeEl.empty();
  new QRCode(qrCodeEl[0], {
    text: link || Session.getMyChatLink(),
    width: 320,
    height: 320,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

class NewChat extends Component {
  constructor() {
    super();
    this.eventListeners = [];
  }

  componentDidUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  componentDidMount() {
    localState.get('chatLinks').on((chatLink, a, b, e) => {
      this.eventListeners.push(e);
      const row = $('<div>').addClass('flex-row');
      const copyBtn = $('<button>').text(t('copy')).width(100);
      copyBtn.on('click', event => {
        Helpers.copyToClipboard(chatLink.url);
        var te = $(event.target);
        var originalText = te.text();
        te.text(t('copied'));
        setTimeout(() => {
          te.text(originalText);
        }, 2000);
      });
      const copyDiv = $('<div>').addClass('flex-cell no-flex').append(copyBtn);
      row.append(copyDiv);
      const input = $('<input>').attr('type', 'text').val(chatLink.url);
      input.on('click', () => input.select());
      row.append($('<div>').addClass('flex-cell').append(input));
      const removeBtn = $('<button>').text(t('remove'));
      row.append($('<div>').addClass('flex-cell no-flex').append(removeBtn));
      $('#my-chat-links').append(row);
      setChatLinkQrCode(chatLink.url);
    });

    $('#show-my-qr-btn').off().click(() => {
      $('#my-qr-code').toggle()
    });

    $('#generate-chat-link').off().on('click', Session.createChatLink);
    $(".profile-link").attr('href', Helpers.getUserChatLink(Session.getKey() && Session.getKey().pub)).off().on('click', e => {
      e.preventDefault();
      route('/profile/' + Session.getKey().pub);
    });
  }

  render() {
    return html`
      <div class="main-view" id="new-chat">
        <h3>${t('have_someones_chat_link')}</h3>
        <input id="paste-chat-link" onInput=${e => onPasteChatLink(e)} type="text" placeholder="${t('paste_their_chat_link')}"/>
        <button id="scan-chatlink-qr-btn" onClick=${scanChatLinkQr}>${t('or_scan_qr_code')}</button>
        <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
        <h3>${t('give_your_chat_link')}</h3>
        <${CopyButton} text=${t('copy_your_chat_link')} copyStr=${Session.getMyChatLink}/>
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
  }
}

export default NewChat;
