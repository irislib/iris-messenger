import { html, render } from './lib/htm.preact.js';
import Translation from './Translation.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import Gallery from './Gallery.js';
import Session from './Session.js';
import Settings, {LogoutConfirmation, init as initSettings} from './Settings.js';
import ChatView, {NewChat, chats, init as initChat} from './Chat.js';
import Profile from './Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

Gun.log.off = true;
var gunOpts = { peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity };
gunOpts.store = RindexedDB(gunOpts);
var publicState = Gun(gunOpts);
var localState = Gun({multicast:false}).get('state').put({activeChat:null});
window.gun = publicState;
window.localState = localState;

Helpers.checkColorScheme();

let activeChat;
let activeProfile;
localState.get('activeChat').on(a => activeChat = a);
localState.get('activeProfile').on(a => activeProfile = a);

const Main = html`
  <div id="main-content">
    <${Session.Login}/>
    <${Session.SideBar}/>

    <section class="main">
      <header>
        <div id="back-button" class="visible-xs-inline-block">
          ‹
          <span class="unseen unseen-total"></span>
        </div>
        <div id="header-content"></div>
      </header>

      <${ChatView}/>
      <${NewChat}/>
      <${Settings}/>
      <${LogoutConfirmation}/>
      <${Profile.Profile}/>
    </section>
  </div>
`;

render(Main, document.body);

Session.init();
PeerManager.init();
Gallery.init();
initSettings();
initChat();
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

export {publicState, localState, showMenu, activeChat, activeProfile, resetView};
