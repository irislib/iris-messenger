/*import { html } from 'htm/preact';
import { translate as t } from '../../Translation';
import State from '../../State';
import QRScanner from '../../QRScanner';
import Session from '../../Session';
import CopyButton from '../../components/CopyButton';
import { route } from 'preact-router';
import $ from 'jquery';
import QRCode from '../../lib/qrcode.min';
import iris from 'iris-lib';
import Component from '../../BaseComponent';
import {Helmet} from 'react-helmet';
import Button from '../../components/basic/Button';
import Helpers from '../../Helpers';

function setChatLinkQrCode(link) {
  let qrCodeEl = $('#my-qr-code');
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
    this.chatLinks = {};
    this.state = {chatLinks: {}};
  }

  scanChatLinkQr() {
    if ($('#chatlink-qr-video:visible').length) {
      $('#chatlink-qr-video').hide();
      QRScanner.cleanupScanner();
    } else {
      $('#chatlink-qr-video').show();
      QRScanner.startChatLinkQRScanner(result => result.text && Helpers.followChatLink(result.text));
    }
  }

  onPasteChatLink(e) {
    const val = $(e.target).val();
    Helpers.followChatLink(val);
    $(e.target).val('');
  }

  onSubscribeHashtag(e) {
    e.preventDefault();
    const v = $('#new-hashtag').val().trim().toLowerCase().replace('#', '');
    if (v.length && v.match(/^\w+$/)) {
      State.public.user().get('hashtagSubscriptions').get(v).put(true);
      route(`/hashtag/${v}`);
    }
  }

  onCreateGroupSubmit(e) {
    e.preventDefault();
    if ($('#new-group-name').val().length) {
      let c = new iris.Channel({
        gun: State.public,
        key: Session.getKey(),
        participants: [],
      });
      c.put('name', $('#new-group-name').val());
      $('#new-group-name').val('');
      Session.addChannel(c);
      route(`/group/${  c.uuid}`);
    }
  }

  componentDidMount() {
    State.local.get('chatLinks').map(this.sub(
      (url, id) => {
        if (url) {
          if (typeof url !== 'string' || url.indexOf('http') !== 0) return;
          this.chatLinks[id] = url;
          setChatLinkQrCode(url);
        } else {
          delete this.chatLinks[id];
        }
        this.setState({chatLinks: this.chatLinks});
      }
    ));
  }

  removeChatLink(id) {
    State.local.get('chatLinks').get(id).put(null);
    return iris.Channel.removePrivateChatLink(State.public, Session.getKey(), id);
  }

  render() {
    return html`
      <${Helmet}><title>${t('new_chat')}</title><//>
      <div class="main-view" id="new-chat">
        <h3>${t('have_someones_invite_link')}</h3>
          <div class="btn-group">
            <input id="paste-chat-link" onInput=${e => this.onPasteChatLink(e)} type="text" placeholder="${t('paste_their_invite_link')}"/>
            <${Button} id="scan-chatlink-qr-btn" onClick=${() => this.scanChatLinkQr()}>${t('or_scan_qr_code')}<//>
          </div>
        <video id="chatlink-qr-video" width="320" height="320" style="object-fit: cover;"></video>
        <h3>${t('give_your_invite_link')}</h3>
        <div class="btn-group">
          <${CopyButton} text=${t('copy_your_invite_link')} copyStr=${Session.getMyChatLink}/>
          <${Button} onClick=${() => $('#my-qr-code').toggle()}>${t('or_show_qr_code')}<//>
        </div>
        <p id="my-qr-code" class="qr-container" style="display:none"></p>
        <p><small dangerouslySetInnerHTML=${{ __html: t('beware_of_sharing_invite_link_publicly', `href="/profile/${Session.getPubKey()}"`) }}></small></p>
        <h3>${t('new_group')}</h3>
        <p>
          <form onSubmit=${e => this.onCreateGroupSubmit(e)}>
            <input id="new-group-name" type="text" placeholder="${t('group_name')}"/>
            <${Button} type="submit">${t('create')}<//>
          </form>
        </p>
        <hr/>
        <h3>${t('your_invite_links')}</h3>
        <p><${Button} onClick=${() => Session.createChatLink()}>${t('create_new_invite_link')}<//></p>
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
                  <${Button} onClick=${() => this.removeChatLink(id)}>${t('remove')}<//>
                </div>
              </div>
            `;
          })}
        </div>
      </div>`;
  }
}

export default NewChat;*/
