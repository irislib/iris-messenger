import Helpers from '../Helpers.js';
import {chats} from './Chats.js';
import {activeChat} from './Main.js';

var ANIMATE_DURATION = 200;

function openAttachmentsPreview() {
  $('#floating-day-separator').remove();
  var attachmentsPreview = $('#attachment-preview');
  attachmentsPreview.removeClass('gallery');
  attachmentsPreview.empty();
  var closeBtn = $('<button>').text('Cancel').click(closeAttachmentsPreview);
  attachmentsPreview.append(closeBtn);

  var files = $('#attachment-input')[0].files;
  if (files) {
    attachmentsPreview.show();
    $('#message-list').hide();
    for (var i = 0;i < files.length;i++) {
      Helpers.getBase64(files[i]).then(base64 => {
        chats[activeChat].attachments = chats[activeChat].attachments || [];
        chats[activeChat].attachments.push({type: 'image', data: base64});
        var preview = Helpers.setImgSrc($('<img>'), base64);
        attachmentsPreview.append(preview);
      });
    }
    $('#new-msg').focus();
  }
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
}

function closeAttachmentsPreview() {
  $('#attachment-preview').hide();
  $('#attachment-preview').removeClass('gallery');
  $('#message-list').show();
  if (activeChat) {
    chats[activeChat].attachments = null;
  }
  Helpers.scrollToMessageListBottom();
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
  if (activeChat) {
    chats[activeChat].attachments = null;
  }
}

function init() {
  $('#attach-file').click(event => {
    event.preventDefault();
    $('#attachment-input').click();
  })
  $('#attachment-input').change(openAttachmentsPreview);
  $(document).keyup(function(e) {
    if (e.key === "Escape") { // escape key maps to keycode `27`
      if ($('#attachment-preview.gallery:visible').length) {
        closeAttachmentsGallery();
      } else {
        closeAttachmentsPreview();
      }
    }
  });
}

function reset() {
  closeAttachmentsPreview();
}

export default {init, reset, closeAttachmentsPreview, openAttachmentsGallery};
