import { html } from 'htm/preact';
import $ from 'jquery';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Key from '../nostr/Key';

import Name from './Name';
import Torrent from './Torrent';

const ANIMATE_DURATION = 200;

const seenIndicator = html`<span class="seen-indicator"
  ><svg viewBox="0 0 59 42">
    <polygon
      fill="currentColor"
      points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"
    ></polygon>
    <polygon
      class="iris-delivered-checkmark"
      fill="currentColor"
      points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"
    ></polygon></svg
></span>`;

class Message extends Component {
  constructor() {
    super();
    this.i = 0;
    this.state = {
      text: '',
    };
  }

  componentDidMount() {
    $(this.base)
      .find('a')
      .click((e) => {
        const href = $(e.target).attr('href');
        if (href && href.indexOf('https://iris.to/') === 0) {
          e.preventDefault();
          window.location = href.replace('https://iris.to/', '');
        }
      });
    Key.decryptMessage(this.props.id, (text) => {
      this.setState({ text });
    });
  }

  onNameClick() {
    route(`/${Key.toNostrBech32Address(this.props.pubkey, 'npub')}`);
  }

  openAttachmentsGallery(event) {
    const msg = this.state.msg || this.props;
    $('#floating-day-separator').remove();
    const attachmentsPreview = $('<div>')
      .attr('id', 'attachment-gallery')
      .addClass('gallery')
      .addClass('attachment-preview');
    $('body').append(attachmentsPreview);
    attachmentsPreview.fadeIn(ANIMATE_DURATION);
    let left, top, width, img;

    if (msg.attachments) {
      msg.attachments.forEach((a) => {
        if (a.type.indexOf('image') === 0 && a.data) {
          img = Helpers.setImgSrc($('<img>'), a.data);
          if (msg.attachments.length === 1) {
            attachmentsPreview.css({ 'justify-content': 'center' });
            let original = $(event.target);
            left = original.offset().left;
            top = original.offset().top - $(window).scrollTop();
            width = original.width();
            let transitionImg = img
              .clone()
              .attr('id', 'transition-img')
              .data('originalDimensions', { left, top, width });
            transitionImg.css({
              position: 'fixed',
              left,
              top,
              width,
              'max-width': 'none',
              'max-height': 'none',
            });
            img.css({ visibility: 'hidden', 'align-self': 'center' });
            attachmentsPreview.append(img);
            $('body').append(transitionImg);
            let o = img.offset();
            transitionImg.animate(
              { width: img.width(), left: o.left, top: o.top },
              {
                duration: ANIMATE_DURATION,
                complete: () => {
                  img.css({ visibility: 'visible' });
                  transitionImg.hide();
                },
              },
            );
          } else {
            attachmentsPreview.css({ 'justify-content': '' });
            attachmentsPreview.append(img);
          }
        }
      });
    }
    attachmentsPreview.one('click', () => {
      this.closeAttachmentsGallery();
    });
    $(document)
      .off('keyup')
      .on('keyup', (e) => {
        if (e.key === 'Escape') {
          // escape key maps to keycode `27`
          $(document).off('keyup');
          if ($('#attachment-gallery:visible').length) {
            this.closeAttachmentsGallery();
          }
        }
      });
  }

  closeAttachmentsGallery() {
    let transitionImg = $('#transition-img');
    if (transitionImg.length) {
      let originalDimensions = transitionImg.data('originalDimensions');
      transitionImg.show();
      $('#attachment-gallery img').remove();
      transitionImg.animate(originalDimensions, {
        duration: ANIMATE_DURATION,
        complete: () => {
          transitionImg.remove();
        },
      });
    }
    $('#attachment-gallery').fadeOut({
      duration: ANIMATE_DURATION,
      complete: () => $('#attachment-gallery').remove(),
    });
    if ('activeElement' in document) {
      document.activeElement.blur();
    }
  }

  render() {
    const emojiOnly =
      this.state.text && this.state.text.length === 2 && Helpers.isEmoji(this.state.text);

    let text = Helpers.highlightEverything(this.state.text || '');

    const time =
      typeof this.props.created_at === 'object'
        ? this.props.created_at
        : new Date(this.props.created_at * 1000);

    const status = ''; // this.getSeenStatus();
    const seen = status.seen ? 'seen' : '';
    const delivered = status.delivered ? 'delivered' : '';
    const whose = this.props.selfAuthored ? 'our' : 'their';

    return html`
      <div class="msg ${whose} ${seen} ${delivered}">
        <div class="msg-content">
          <div class="msg-sender">
            ${this.props.showName &&
            html`
              <small onclick=${() => this.onNameClick()} class="msgSenderName">
                <${Name} key=${this.props.pubkey} pub=${this.props.pubkey}
              /></small>
            `}
          </div>
          ${this.props.torrentId ? html` <${Torrent} torrentId=${this.props.torrentId} /> ` : ''}
          ${this.props.attachments &&
          this.props.attachments.map(
            (a) =>
              html`<div class="img-container">
                <img
                  src=${a.data}
                  onclick=${(e) => {
                    this.openAttachmentsGallery(e);
                  }}
                />
              </div>`, // TODO: escape a.data
          )}
          <div class="text ${emojiOnly && 'emoji-only'}">${text}</div>
          <div class="below-text">
            <div class="time">
              ${this.props.hash
                ? html`<a href="/post/${encodeURIComponent(this.props.hash)}"
                    >${Helpers.getRelativeTimeText(time)}</a
                  >`
                : Helpers.formatTime(time)}
              ${this.props.selfAuthored && seenIndicator}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export default Message;
