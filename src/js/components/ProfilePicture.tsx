import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { Component } from 'preact';

import Helpers from '../Helpers';

import SafeImg from './SafeImg';

type Props = { picture?: string };
const ANIMATE_DURATION = 200;

class ProfilePicture extends Component<Props> {
  render() {
    console.log('rendering ProfilePicture', this.props.picture);
    return html`<${SafeImg}
      class="profile-picture"
      src=${this.props.picture}
      onClick=${(e) => {
        this.imageClicked(e);
      }}
    />`;
  }

  openAttachmentsGallery(event) {
    $('#floating-day-separator').remove();
    const attachmentsPreview = $('<div>')
      .attr('id', 'attachment-gallery')
      .addClass('gallery')
      .addClass('attachment-preview');
    $('body').append(attachmentsPreview);
    attachmentsPreview.fadeIn(ANIMATE_DURATION);
    let left, top, width, img;

    if (this.props.picture) {
      img = Helpers.setImgSrc($('<img>'), this.props.picture);
      attachmentsPreview.css({ 'justify-content': 'center' });
      const original = $(event.target);
      left = original.offset().left;
      top = original.offset().top - $(window).scrollTop();
      width = original.width();
      const transitionImg = img
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
      const o = img.offset();
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
    const transitionImg = $('#transition-img');
    if (transitionImg.length) {
      const originalDimensions = transitionImg.data('originalDimensions');
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
    const activeChat = window.location.hash.replace('/', '').replace('/chat/', '');
    iris.private(activeChat).attachments = null;
  }

  imageClicked(event) {
    event.preventDefault();
    if (window.innerWidth >= 625) {
      this.openAttachmentsGallery(event);
    }
  }
}
export default ProfilePicture;
