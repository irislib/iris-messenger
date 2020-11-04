import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import { addChat, followChatLink } from '../Chat.js';
import { localState, publicState } from '../Main.js';
import Helpers from '../Helpers.js';
import QRScanner from '../QRScanner.js';
import Session from '../Session.js';
import CopyButton from './CopyButton.js';
import { Component } from '../lib/preact.js';
import { route } from '../lib/preact-router.es.js';

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
    this.eventListeners = {};
    this.chatLinks = {};
    this.state = {chatLinks: {}};
  }

  componentDidUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  scanChatLinkQr() {
    if ($('#chatlink-qr-video:visible').length) {
      $('#chatlink-qr-video').hide();
      QRScanner.cleanupScanner();
    } else {
      $('#chatlink-qr-video').show();
      QRScanner.startChatLinkQRScanner(result => result.text && followChatLink(result.text));
    }
  }

  onPasteChatLink(e) {
    const val = $(e.target).val();
    followChatLink(val);
    $(e.target).val('');
  }

  onCreateGroupSubmit(e) {
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

  componentDidMount() {
    localState.get('chatLinks').map().on((url, id, b, e) => {
      this.eventListeners['chatLinks'] = e;
      if (url) {
        if (typeof url !== 'string' || url.indexOf('http') !== 0) return;
        this.chatLinks[id] = url;
        setChatLinkQrCode(url);
      } else {
        delete this.chatLinks[id];
      }
      this.setState({chatLinks: this.chatLinks});
    });

    $(".profile-link").attr('href', Helpers.getProfileLink(Session.getKey() && Session.getKey().pub)).off().on('click', e => {
      e.preventDefault();
      route('/profile/' + Session.getKey().pub);
    });
  }

  render() {
    return html`
      <div class="main-view" id="new-chat">
        <h3>${t('have_someones_invite_link')}</h3>
        <input id="paste-chat-link" onInput=${e => this.onPasteChatLink(e)} type="text" placeholder="${t('paste_their_invite_link')}"/>
        <button id="scan-chatlink-qr-btn" onClick=${() => this.scanChatLinkQr()}>${t('or_scan_qr_code')}</button>
        <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
        <h3>${t('give_your_invite_link')}</h3>
        <${CopyButton} text=${t('copy_your_invite_link')} copyStr=${Session.getMyChatLink}/>
        <button onClick=${() => $('#my-qr-code').toggle()}>${t('or_show_qr_code')}</button>
        <p id="my-qr-code" class="qr-container" style="display:none"></p>
        <p><small dangerouslySetInnerHTML=${{ __html: t('beware_of_sharing_invite_link_publicly') }}></small></p>
        <h3>${t('new_group')}</h3>
        <p>
          <form id="new-group-form" onSubmit=${e => this.onCreateGroupSubmit(e)}>
            <input id="new-group-name" type="text" placeholder="${t('group_name')}"/>
            <button type="submit">${t('create')}</button>
          </form>
        </p>
        <hr/>
        <h3>${t('your_invite_links')}</h3>
        <p><button onClick=${() => Session.createChatLink()}>${t('create_new_invite_link')}</button></p>
        <div id="my-chat-links" class="flex-table">
          ${Object.keys(this.state.chatLinks).map(id => {
            const url = this.state.chatLinks[id];
            return html`
              <div class="flex-row">
                <div class="flex-cell no-flex">
                  <${CopyButton} copyStr=${url}/>
                </div>
                <div class="flex-cell">
                  <input type="text" value=${url} onClick=${e => $(e.target).select()}/>
                </div>
                <div class="flex-cell no-flex">
                  <button onClick=${() => Session.removeChatLink(id)}>${t('remove')}</button>
                </div>
              </div>
            `;
          })}
        </div>
      </div>`;
  }
}

export default NewChat;
