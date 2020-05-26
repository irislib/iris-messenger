import {gun, resetView} from './Main.js';
import Session from './Session.js';
import Helpers from '../Helpers.js';

function render() {
  resetView();
  $('#header-content').text('Settings');
  $('#settings').show();
  var el = $('#profile-photo-settings');
  $('#profile-photo-chapter').after(el);
  $('#current-profile-photo').toggle(!!Session.myProfilePhoto);
  Helpers.setImgSrc($('#current-profile-photo'), Session.myProfilePhoto);
  $('#add-profile-photo').toggle(!Session.myProfilePhoto);
}

function togglePrivateKeyQR(e) {
  var btn = $('#show-private-key-qr');
  var show = $('#private-key-qr').length === 0;
  var SHOW_TEXT = 'Show private key QR code';
  function hideText(s) { return 'Hide private key QR code (' + s + ')'; }
  if (show) {
    var showPrivateKeySecondsRemaining = 20;
    btn.text(hideText(showPrivateKeySecondsRemaining));
    var hidePrivateKeyInterval = setInterval(() => {
      if ($('#private-key-qr').length === 0) {
        clearInterval(hidePrivateKeyInterval);
        btn.text(SHOW_TEXT);
      }
      showPrivateKeySecondsRemaining -= 1;
      if (showPrivateKeySecondsRemaining === 0) {
       $('#private-key-qr').remove();
        btn.text(SHOW_TEXT);
        clearInterval(hidePrivateKeyInterval);
      } else {
        btn.text(hideText(showPrivateKeySecondsRemaining));
      }
    }, 1000);
    var qrCodeEl = $('<div>').attr('id', 'private-key-qr').addClass('qr-container').insertAfter(btn);
    var qrcode = new QRCode(qrCodeEl[0], {
      text: JSON.stringify(Session.key),
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  } else {
    $('#private-key-qr').remove();
    btn.text(SHOW_TEXT);
  }
}

function showLogoutConfirmation() {
  resetView();
  $('#header-content').text('Log out?');
  $('#logout-confirmation').show();
}

function init() {
  $('#download-private-key').click(Helpers.downloadKey);
  $('#show-private-key-qr').click(togglePrivateKeyQR);
  $('.open-settings-button').click(render);
  $(".user-info").off().on('click', render);
  $('#settings-name').on('input', event => {
    var name = $(event.target).val().trim();
    gun.user().get('profile').get('name').put(name);
  });

  $('#settings-about').on('input', event => {
    var about = $(event.target).val().trim();
    gun.user().get('profile').get('about').put(about);
  });

  $('.show-logout-confirmation').click(showLogoutConfirmation);

  $('.copy-chat-link').click(event => {
    Helpers.copyToClipboard(Session.getMyChatLink());
    var t = $(event.target);
    var originalText = t.text();
    var originalWidth = t.width();
    t.width(originalWidth);
    t.text('Copied');
    setTimeout(() => {
      t.text(originalText);
      t.css('width', '');
    }, 2000);
  });

  $('#copy-private-key').click(event => {
    Helpers.copyToClipboard(JSON.stringify(key));
    var t = $(event.target);
    var originalText = t.text();
    var originalWidth = t.width();
    t.width(originalWidth);
    t.text('Copied');
    setTimeout(() => {
      t.text(originalText);
      t.css('width', '');
    }, 2000);
  });
}

export default {init};
