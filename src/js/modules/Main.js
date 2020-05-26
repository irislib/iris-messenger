import MainTemplate from './MainTemplate.js';
import Translation, { translate as t } from './Translation.js';
import Helpers from '../Helpers.js';
import PeerManager from './PeerManager.js';
import Notifications from './Notifications.js';
import VideoCall from './VideoCall.js';
import Gallery from './Gallery.js';
import Session from './Session.js';
import Settings from './Settings.js';
import Chats, {chats} from './Chats.js';
import Profile from './Profile.js';

Gun.log.off = true;
var gunOpts = { peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity };
if (!iris.util.isElectron) {
  gunOpts.store = RindexedDB(gunOpts);
}
var gun = Gun(gunOpts);
window.gun = gun;

Helpers.checkColorScheme();

var activeChat;
var activeProfile;

if (iris.util.isElectron) {
  function refreshUnlessActive() { // hacky way to make sure that gun resubscribes multicast on network changes
    if (!Session.areWeOnline) { // if you haven't been active in the window in the last 60 seconds
      location.reload();
    }
  }
  window.addEventListener('online',  refreshUnlessActive);
}

var main_content_temp = _.template(MainTemplate);
$('body').prepend($('<div>').attr('id', 'main-content').html(main_content_temp(Translation.translation)));
Session.init();
PeerManager.init();
Gallery.init();
Settings.init();
Chats.init();
Translation.init();
Profile.init();

$(window).load(() => {
  $('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails
});

Helpers.showConsoleWarning();

var emojiButton = $('#emoji-picker');
if (!iris.util.isMobile) {
  emojiButton.show();
  var picker = new EmojiButton({position: 'top-start'});

  picker.on('emoji', emoji => {
    $('#new-msg').val($('#new-msg').val() + emoji);
    $('#new-msg').focus();
  });

  emojiButton.click(event => {
    event.preventDefault();
    picker.pickerVisible ? picker.hidePicker() : picker.showPicker(emojiButton);
  });
}

$('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

function resetView() {
  if (activeChat) {
    chats[activeChat].setTyping(false);
  }
  activeChat = null;
  activeProfile = null;
  showMenu(false);
  cleanupScanner();
  $('#chatlink-qr-video').hide();
  $('.chat-item').toggleClass('active', false);
  $('.main-view').hide();
  $('#not-seen-by-them').hide();
  $(".message-form").hide();
  $("#header-content").empty();
  $("#header-content").css({cursor: null});
  $('#private-key-qr').remove();
  Gallery.reset();
}

function showMenu(show = true) {
  $('.sidebar').toggleClass('hidden-xs', !show);
  $('.main').toggleClass('hidden-xs', show);
}
$('#back-button').off().on('click', () => {
  resetView();
  showMenu(true);
});

function renderGroupPhotoSettings(uuid) {
  var me = chats[uuid].participantProfiles[key.pub];
  var isAdmin = !!(me && me.permissions && me.permissions.admin);
  $('#profile-group-settings').toggle(isAdmin);
  $('#current-profile-photo').toggle(!!chats[uuid].photo);
  $('#profile .profile-photo').toggle(!!chats[uuid].photo);
  if (isAdmin) {
    Helpers.setImgSrc($('#current-profile-photo'), chats[uuid].photo);
    $('#profile .profile-photo').hide();
    renderProfilePhotoSettings();
    var el = $('#profile-photo-settings');
    $('#profile-group-settings').prepend(el);
    $('#add-profile-photo').toggle(!chats[uuid].photo);
  }
}

var cropper;
function renderProfilePhotoSettings() {
  $('#profile-photo-error').toggleClass('hidden', true);
  var files = $('#profile-photo-input')[0].files;
  if (files && files.length) {
    var file = files[0];
    /*
    if (file.size > 1024 * 200) {
      $('#profile-photo-error').toggleClass('hidden', false);
      return console.error('file too big');
    }
    */
    // show preview
    $('#current-profile-photo').hide();
    $('#add-profile-photo').hide();
    Helpers.getBase64(file).then(base64 => {
      var previewEl = $('#profile-photo-preview');
      Helpers.setImgSrc(previewEl, base64);
      $('#profile-photo-preview').toggleClass('hidden', false);
      $('#cancel-profile-photo').toggleClass('hidden', false);
      $('#use-profile-photo').toggleClass('hidden', false);
      cropper = new Cropper(previewEl[0], {
        aspectRatio:1,
        autoCropArea: 1,
        viewMode: 1,
        background: false,
        zoomable: false
      });
    });
  } else {
    cropper && cropper.destroy();
    // show current profile photo
    if (!$('#current-profile-photo').attr('src')) {
      $('#add-profile-photo').show();
    }
    Helpers.setImgSrc($('#profile-photo-preview'), '');
    $('#cancel-profile-photo').toggleClass('hidden', true);
    $('#use-profile-photo').toggleClass('hidden', true);
  }
}
$('#current-profile-photo, #add-profile-photo').click(() => $('#profile-photo-input').click());
$('#profile-photo-input').change(e => {
  renderProfilePhotoSettings();
});
$('#use-profile-photo').click(() => {
  var canvas = cropper.getCroppedCanvas();
  var resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = resizedCanvas.height = Math.min(canvas.width, 800);
  pica().resize(canvas, resizedCanvas).then(result => {
    var src = resizedCanvas.toDataURL('image/jpeg');
    // var src = $('#profile-photo-preview').attr('src');
    if (activeProfile) {
      chats[activeProfile].put('photo', src);
    } else {
      gun.user().get('profile').get('photo').put(src);
    }
    Helpers.setImgSrc($('#current-profile-photo'), src);
    $('#profile-photo-input').val('');
    renderProfilePhotoSettings();
  });
});
$('#cancel-profile-photo').click(() => {
  $('#profile-photo-input').val('');
  renderProfilePhotoSettings();
});
$('#remove-profile-photo').click(() => {
  if (activeProfile) {
    chats[activeProfile].put('photo', null);
  } else {
    gun.user().get('profile').get('photo').put(null);
  }
  renderProfilePhotoSettings();
});

function setActiveChat(pub) {
  activeChat = pub;
}

function setActiveProfile(pub) {
  activeProfile = pub;
}

export {gun, setActiveChat, activeChat, setActiveProfile, activeProfile, resetView};
