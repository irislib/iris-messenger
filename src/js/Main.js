import { html, render } from './lib/htm.preact.js';
import Translation from './Translation.js';
import Helpers from './Helpers.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import Settings, {LogoutConfirmation, init as initSettings} from './Components/Settings.js';
import {chats, showNewChat} from './Chat.js';
import NewChat from './components/NewChat.js';
import ChatView from './components/ChatView.js';
import Login from './components/Login.js';
import SideBar from './components/SideBar.js';
import PublicMessages from './PublicMessages.js';
import Profile from './components/Profile.js';
import QRScanner from './QRScanner.js';
import VideoCall from './VideoCall.js';

const userAgent = navigator.userAgent.toLowerCase();
const isElectron = (userAgent.indexOf(' electron/') > -1);
if (!isElectron && ('serviceWorker' in navigator)) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('serviceworker.js')
    .catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

Gun.log.off = true;
var gunOpts = { peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity };
gunOpts.store = RindexedDB(gunOpts);
var publicState = Gun(gunOpts);
window.publicState = publicState;
var localState = Gun({peers: [], file: 'localState', multicast:false}).get('state').put({activeChat:'new'});
window.localState = localState;

Helpers.checkColorScheme();

let activeChat;
let activeProfile;
localState.get('activeChat').on(a => activeChat = a);
localState.get('activeProfile').on(a => activeProfile = a);

const Main = html`
  <div id="main-content">
    <${Login}/>
    <${SideBar}/>

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
initSettings();
Translation.init();
Profile.init();
VideoCall.init();
PublicMessages.init();

$('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails

Helpers.showConsoleWarning();

$('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

$(window).resize(() => { // if resizing up from mobile size menu view
  if ($(window).width() > 565 && $('.main-view:visible').length === 0) {
    showNewChat();
  }
});


function resetView() {
  if (activeChat && chats[activeChat]) {
    chats[activeChat].setTyping(false);
  }
  activeChat = null;
  activeProfile = null;
  showMenu(false);
  QRScanner.cleanupScanner();
  $('#chatlink-qr-video').hide();
  $('.main-view').hide();
  $('#not-seen-by-them').hide();
  $(".message-form").hide();
  $("#header-content").empty();
  $("#header-content").css({cursor: null});
  $('#private-key-qr').remove();
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
