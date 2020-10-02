import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import Helpers from '../Helpers.js';
import {chats} from '../Chat.js';
import Identicon from './Identicon.js';
import {activeRoute, publicState} from '../Main.js';
import { route } from '../lib/preact-router.es.js';
import Session from '../Session.js';

const autolinker = new Autolinker({ stripPrefix: false, stripTrailingSlash: false});
const ANIMATE_DURATION = 200;

const seenIndicator = html`<span class="seen-indicator"><svg viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

const heartEmpty = html`<svg width="20" viewBox="0 -28 512.001 512"><path fill="currentColor" d="m256 455.515625c-7.289062 0-14.316406-2.640625-19.792969-7.4375-20.683593-18.085937-40.625-35.082031-58.21875-50.074219l-.089843-.078125c-51.582032-43.957031-96.125-81.917969-127.117188-119.3125-34.644531-41.804687-50.78125-81.441406-50.78125-124.742187 0-42.070313 14.425781-80.882813 40.617188-109.292969 26.503906-28.746094 62.871093-44.578125 102.414062-44.578125 29.554688 0 56.621094 9.34375 80.445312 27.769531 12.023438 9.300781 22.921876 20.683594 32.523438 33.960938 9.605469-13.277344 20.5-24.660157 32.527344-33.960938 23.824218-18.425781 50.890625-27.769531 80.445312-27.769531 39.539063 0 75.910156 15.832031 102.414063 44.578125 26.191406 28.410156 40.613281 67.222656 40.613281 109.292969 0 43.300781-16.132812 82.9375-50.777344 124.738281-30.992187 37.398437-75.53125 75.355469-127.105468 119.308594-17.625 15.015625-37.597657 32.039062-58.328126 50.167969-5.472656 4.789062-12.503906 7.429687-19.789062 7.429687zm-112.96875-425.523437c-31.066406 0-59.605469 12.398437-80.367188 34.914062-21.070312 22.855469-32.675781 54.449219-32.675781 88.964844 0 36.417968 13.535157 68.988281 43.882813 105.605468 29.332031 35.394532 72.960937 72.574219 123.476562 115.625l.09375.078126c17.660156 15.050781 37.679688 32.113281 58.515625 50.332031 20.960938-18.253907 41.011719-35.34375 58.707031-50.417969 50.511719-43.050781 94.136719-80.222656 123.46875-115.617188 30.34375-36.617187 43.878907-69.1875 43.878907-105.605468 0-34.515625-11.605469-66.109375-32.675781-88.964844-20.757813-22.515625-49.300782-34.914062-80.363282-34.914062-22.757812 0-43.652344 7.234374-62.101562 21.5-16.441406 12.71875-27.894532 28.796874-34.609375 40.046874-3.453125 5.785157-9.53125 9.238282-16.261719 9.238282s-12.808594-3.453125-16.261719-9.238282c-6.710937-11.25-18.164062-27.328124-34.609375-40.046874-18.449218-14.265626-39.34375-21.5-62.097656-21.5zm0 0"/></svg>`;

const heartFull = html`<svg width="20" viewBox="0 -28 512.00002 512"><path fill="currentColor" d="m471.382812 44.578125c-26.503906-28.746094-62.871093-44.578125-102.410156-44.578125-29.554687 0-56.621094 9.34375-80.449218 27.769531-12.023438 9.300781-22.917969 20.679688-32.523438 33.960938-9.601562-13.277344-20.5-24.660157-32.527344-33.960938-23.824218-18.425781-50.890625-27.769531-80.445312-27.769531-39.539063 0-75.910156 15.832031-102.414063 44.578125-26.1875 28.410156-40.613281 67.222656-40.613281 109.292969 0 43.300781 16.136719 82.9375 50.78125 124.742187 30.992188 37.394531 75.535156 75.355469 127.117188 119.3125 17.613281 15.011719 37.578124 32.027344 58.308593 50.152344 5.476563 4.796875 12.503907 7.4375 19.792969 7.4375 7.285156 0 14.316406-2.640625 19.785156-7.429687 20.730469-18.128907 40.707032-35.152344 58.328125-50.171876 51.574219-43.949218 96.117188-81.90625 127.109375-119.304687 34.644532-41.800781 50.777344-81.4375 50.777344-124.742187 0-42.066407-14.425781-80.878907-40.617188-109.289063zm0 0"/></svg>`;

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
    this.eventListeners = {};
    this.likedBy = new Set();
  }

  componentDidMount() {
    $(this.base).find('a').click(e => {
      const href = $(e.target).attr('href');
      if (href && href.indexOf('https://iris.to/') === 0) {
        e.preventDefault();
        window.location = href.replace('https://iris.to/', '');
      }
    });
    if (this.props.public && this.props.info && this.props.info.hash) {
      publicState.user().get('likes').get(this.props.info.hash).on((liked, a, b, e) => {
        this.eventListeners['likes'] = e;
        liked ? this.likedBy.add(Session.getKey().pub) : this.likedBy.delete(Session.getKey().pub);
        this.setState({liked, likes: this.likedBy.size});
      });
      publicState.user().get('follow').once().map().once((isFollowing, key) => {
        if (!isFollowing) return;
        publicState.user(key).get('likes').get(this.props.info.hash).on(liked => {
          liked ? this.likedBy.add(key) : this.likedBy.delete(key);
          this.setState({likes: this.likedBy.size});
        });
      });
    }
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.liked !== nextState.liked) return true;
    if (this.state.likes !== nextState.likes) return true;
    if (this.state.showLikes !== nextState.showLikes) return true;
    return false;
  }

  onClick(name) {
    if (this.props.public) {
      route('/profile/' + this.props.info.from);
    } else {
      addMention(name);
    }
  }

  likeBtnClicked(e) {
    e.preventDefault();
    const liked = !this.state.liked;
    publicState.user().get('likes').get(this.props.info.hash).put(liked);
  }

  render() {
    if (++this.i > 1) console.log(this.i);
    let name = this.props.name;
    let color;
    const chatId = this.props.chatId;
    const chat = chats[chatId];
    if (chat && chat.uuid && !this.props.info.selfAuthored) {
      const profile = chat.participantProfiles[this.props.info.from];
      name = profile && profile.name;
      color = profile && profile.color;
    }
    const emojiOnly = this.props.text.length === 2 && Helpers.isEmoji(this.props.text);

    const p = document.createElement('p');
    p.innerText = this.props.text;
    const h = emojiOnly ? p.innerHTML : Helpers.highlightEmoji(p.innerHTML);
    const innerHTML = autolinker.link(h);
    const time = typeof this.props.time === 'object' ? this.props.time : new Date(this.props.time);

    const seen = chat && chat.theirMsgsLastSeenDate >= time ? 'seen' : '';
    const delivered = chat && chat.online && chat.online.lastActive && new Date(chat.online.lastActive) >= time ? 'delivered' : '';
    const whose = this.props.selfAuthored ? 'our' : 'their';

    return html`
      <div class="msg ${whose} ${seen} ${delivered}">
        <div class="msg-content">
          <div class="msg-sender">
            ${this.props.public && this.props.info.from ? html`<${Identicon} str=${this.props.info.from} width=40/>` : ''}
            ${name && this.props.showName && html`<small onclick=${() => this.onClick(name)} class="msgSenderName" style="color: ${color}">${name}</small>`}
          </div>
          ${this.props.attachments && this.props.attachments.map(a =>
            html`<div class="img-container"><img src=${a.data} onclick=${e => { openAttachmentsGallery(this.props, e); }}/></div>` // TODO: escape a.data
          )}
          <div class="text ${emojiOnly && 'emoji-only'}" dangerouslySetInnerHTML=${{ __html: innerHTML }} />
          <div class="below-text">
            ${this.props.public ? html`
              <a class="like-btn ${this.state.liked ? 'liked' : ''}" onClick=${e => this.likeBtnClicked(e)}>
                ${this.state.liked ? heartFull : heartEmpty}
              </a>
              <span class="like-count" onClick=${() => this.setState({showLikes: !this.state.showLikes})}>
                ${this.state.likes || ''}
              </span>
            `: ''}
            <div class="time">
              ${this.props.info && this.props.info.hash ? html`<a href="/message/${encodeURIComponent(this.props.info.hash)}">${Helpers.getRelativeTimeText(time)}</a>` : iris.util.formatTime(time)}
              ${this.props.selfAuthored && seenIndicator}
            </div>
          </div>
          ${this.state.showLikes ? html`
            <div class="likes">
              ${Array.from(this.likedBy).map(key => {
                return html`<${Identicon} onClick=${() => route('/profile/' + key)} str=${key} width=32/>`;
              })}
            </div>
          `: ''}
        </div>
      </div>`;
  }
}

export default Message;
