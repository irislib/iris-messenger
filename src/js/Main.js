import { render } from './lib/preact.js';
import { Router } from './lib/preact-router.es.js';
import { createHashHistory } from './lib/history.production.min.js';

import Helpers from './Helpers.js';
import { html } from './Helpers.js';
import QRScanner from './QRScanner.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import {activeRoute} from './Session.js';
import {chats} from './Chat.js';
import PublicMessages from './PublicMessages.js';

import Settings from './components/Settings.js';
import LogoutConfirmation from './components/LogoutConfirmation.js';
import NewChat from './components/NewChat.js';
import ChatView from './components/ChatView.js';
import Login from './components/Login.js';
import SideBar from './components/SideBar.js';
import Profile from './components/Profile.js';
import Header from './components/Header.js';

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
var publicState = Gun({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity });
window.publicState = publicState;
var localState = Gun({peers: [], file: 'localState', multicast:false, localStorage: false}).get('state');
window.localState = localState;
Session.init();

Helpers.checkColorScheme();

const Main = html`
  <div id="main-content">
    <${Login}/>
    <${SideBar}/>
    <section class="main">
      <${Header}/>
      <${Router} history=${createHashHistory()}>
        <${NewChat} path="/"/>
        <${ChatView} path="/chat/:id"/>
        <${Settings} path="/settings"/>
        <${LogoutConfirmation} path="/logout"/>
        <${Profile.Profile} path="/profile/:id"/>
      </${Router}>
    </section>
  </div>
`;

render(Main, document.body);

PeerManager.init();
PublicMessages.init();

$('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails

Helpers.showConsoleWarning();

$(window).resize(() => { // if resizing up from mobile size menu view
  if ($(window).width() > 565 && $('.main-view:visible').length === 0) {
    localState.get('activeRoute').put(null);
  }
});

function resetView() {
  localState.get('activeProfile').put(null);
  if (activeRoute && chats[activeRoute]) {
    chats[activeRoute].setTyping(false);
  }
  showMenu(false);
  QRScanner.cleanupScanner();
  $('#chatlink-qr-video').hide();
  $('#private-key-qr').empty();
}

function showMenu(show = true) {
  $('.sidebar').toggleClass('hidden-xs', !show);
  $('.main').toggleClass('hidden-xs', show);
  localState.get('activeRoute').put(null);
}

export {publicState, localState, showMenu, resetView};
