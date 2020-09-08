import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';
import {chats} from '../Chat.js';
import {activeRoute} from '../Session.js';

const autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
const ANIMATE_DURATION = 200;

const seenIndicator = html`<span class="seen-indicator"><svg viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

function addMention(name) {
  $('#new-msg').val($('#new-msg').val().trim() + ` @${name} `);
  $('#new-msg').focus();
}

function openAttachmentsGallery(msg, event) {
  $('#floating-day-separator').remove();
  var attachmentsPreview = $('#attachment-preview');
  attachmentsPreview.addClass('gallery');
  attachmentsPreview.empty();
  attachmentsPreview.fadeIn(ANIMATE_DURATION);
  var left, top, width, img;

  if (msg.attachments) {
    msg.attachments.forEach(a => {
      if (a.type.indexOf('image') === 0 && a.data) {
        img = Helpers.setImgSrc($('<img>'), a.data);
        if (msg.attachments.length === 1) {
          attachmentsPreview.css({'justify-content': 'center'});
          var original = $(event.target);
          left = original.offset().left;
          top = original.offset().top - $(window).scrollTop();
          width = original.width();
          var transitionImg = img.clone().attr('id', 'transition-img').data('originalDimensions', {left,top,width});
          transitionImg.css({position: 'fixed', left, top, width, 'max-width': 'none', 'max-height': 'none'});
          img.css({visibility: 'hidden', 'align-self': 'center'});
          attachmentsPreview.append(img);
          $('body').append(transitionImg);
          var o = img.offset();
          transitionImg.animate({width: img.width(), left: o.left, top: o.top}, {duration: ANIMATE_DURATION, complete: () => {
            img.css({visibility: 'visible'});
            transitionImg.hide();
          }});
        } else {
          attachmentsPreview.css({'justify-content': ''});
          attachmentsPreview.append(img);
        }
      }
    })
  }
  $('#attachment-preview').one('click', () => {
    closeAttachmentsGallery();
  });
  $(document).off('keyup').on('keyup', e => {
    if (e.key === "Escape") { // escape key maps to keycode `27`
      $(document).off('keyup');
      if ($('#attachment-preview.gallery:visible').length) {
        closeAttachmentsGallery();
      }
    }
  });
}

function closeAttachmentsGallery() {
  var transitionImg = $('#transition-img');
  if (transitionImg.length) {
    var originalDimensions = transitionImg.data('originalDimensions');
    transitionImg.show();
    $('#attachment-preview img').remove();
    transitionImg.animate(originalDimensions, {duration: ANIMATE_DURATION, complete: () => {
      transitionImg.remove();
    }});
  }
  $('#attachment-preview').fadeOut(ANIMATE_DURATION);
  if (activeRoute && chats[activeRoute]) {
    chats[activeRoute].attachments = null;
  }
}

class Message extends Component {
  constructor() {
    super();
    this.i = 0;
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    if (++this.i > 1) console.log(this.i);
    let name, color;
    const chatId = this.props.chatId;
    if (chats[chatId].uuid && !this.props.info.selfAuthored) {
      const profile = chats[chatId].participantProfiles[this.props.info.from];
      name = profile && profile.name;
      color = profile && profile.color;
    }
    const emojiOnly = this.props.text.length === 2 && Helpers.isEmoji(this.props.text);

    const p = document.createElement('p');
    p.innerText = this.props.text;
    const h = emojiOnly ? p.innerHTML : Helpers.highlightEmoji(p.innerHTML);
    const innerHTML = autolinker.link(h);
    const time = typeof this.props.time === 'object' ? this.props.time : new Date(this.props.time);

    const chat = chats[chatId];
    const seen = chat.theirMsgsLastSeenDate >= time ? 'seen' : '';
    const delivered = chat.online && chat.online.lastActive && new Date(chat.online.lastActive) >= time ? 'delivered' : '';
    const whose = this.props.selfAuthored ? 'our' : 'their';

    return html`
      <div class="msg ${whose} ${seen} ${delivered}">
        <div class="msg-content">
          ${name && this.props.showName && html`<small onclick=${() => addMention(name)} class="msgSenderName" style="color: ${color}">${name}</small>`}
          ${this.props.attachments && this.props.attachments.map(a =>
            html`<img src=${a.data} onclick=${e => { openAttachmentsGallery(this.props, e); }}/>` // escape a.data
          )}
          <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerHTML }}>
          </div>
          <div class="time">
            ${this.props.public ? Helpers.getRelativeTimeText(time) : iris.util.formatTime(time)}
            ${this.props.selfAuthored && seenIndicator}
          </div>
        </div>
      </div>`;
  }
}

export default Message;
