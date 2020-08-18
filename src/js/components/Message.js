import { html, Component } from '../lib/htm.preact.js';
import Helpers from '../Helpers.js';
import Gallery from '../Gallery.js';
import {chats} from '../Chat.js';

const autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});

const seenIndicator = html`<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

function addMention(name) {
  $('#new-msg').val($('#new-msg').val().trim() + ` @${name} `);
  $('#new-msg').focus();
}

class Message extends Component {
  constructor() {
    super();
    this.i = 0;
  }

  render() {
    if (++this.i > 1) console.log(this.i);
    let name, color;
    // TODO: public messages
    if (chats[this.props.chatId].uuid && !this.props.info.selfAuthored) {
      const profile = chats[this.props.chatId].participantProfiles[this.props.info.from];
      name = profile && profile.name;
      color = profile && profile.color;
      if (name) {
        var nameEl = $('<small>').click(() => addMention(name)).text(name).css({color}).addClass('msgSenderName');
      }
    }
    const emojiOnly = this.props.text.length === 2 && Helpers.isEmoji(this.props.text);

    const p = document.createElement('p');
    p.innerText = this.props.text;
    const h = emojiOnly ? p.innerHTML : Helpers.highlightEmoji(p.innerHTML);
    const innerHTML = autolinker.link(h);

    return html`
      <div class="msg ${this.props.selfAuthored ? 'our' : 'their'}">
        <div class="msg-content">
          ${name && this.props.showName && html`<small onclick=${() => addMention(name)} class="msgSenderName" style="color: ${color}">${name}</small>`}
          ${this.props.attachments && this.props.attachments.map(a =>
            html`<img src=${a.data} onclick=${e => { Gallery.openAttachmentsGallery(this.props, e); }}/>` // escape a.data
          )}
          <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerHTML }}>
          </div>
          <div class="time">
            ${iris.util.formatTime(this.props.time)}
            ${this.props.selfAuthored && seenIndicator}
          </div>
        </div>
      </div>`;
  }
}

export default Message;
