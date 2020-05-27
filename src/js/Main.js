import MainTemplate from './MainTemplate.js';
import Translation from './Translation.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import Gallery from './Gallery.js';
import Session from './Session.js';
import Settings from './Settings.js';
import Chats, {chats} from './Chats.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

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

var main_content_temp = _.template(MainTemplate);
$('body').prepend($('<div>').attr('id', 'main-content').html(main_content_temp(Translation.translation)));
Session.init();
PeerManager.init();
Gallery.init();
Settings.init();
Chats.init();
Translation.init();
Profile.init();
VideoCall.init();

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
  QRScanner.cleanupScanner();
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

function setActiveChat(pub) {
  activeChat = pub;
}

function setActiveProfile(pub) {
  activeProfile = pub;
}

export {gun, showMenu, setActiveChat, activeChat, setActiveProfile, activeProfile, resetView};
