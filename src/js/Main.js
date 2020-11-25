import { render } from './lib/preact.js';
import { Router, route } from './lib/preact-router.es.js';
import { createHashHistory } from './lib/history.production.min.js';
import { Component } from './lib/preact.js';

import Helpers from './Helpers.js';
import { html } from './Helpers.js';
import QRScanner from './QRScanner.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import PublicMessages from './PublicMessages.js';

import Settings from './components/Settings.js';
import LogoutConfirmation from './components/LogoutConfirmation.js';
import ChatView from './components/ChatView.js';
import StoreView from './components/StoreView.js';
import CheckoutView from './components/CheckoutView.js';
import ProductView from './components/ProductView.js';
import Login from './components/Login.js';
import Profile from './components/Profile.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import MessageView from './components/MessageView.js';
import FollowsView from './components/FollowsView.js';
import FeedView from './components/FeedView.js';
import VideoCall from './components/VideoCall.js';

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
let activeRoute, activeProfile;

Gun.log.off = true;
var publicState = Gun({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity });
window.publicState = publicState;
var localState = Gun({peers: [], file: 'localState', multicast:false, localStorage: false}).get('state');
window.localState = localState;
window.iris.util.setPublicState && window.iris.util.setPublicState(publicState);

Session.init();
PeerManager.init();
PublicMessages.init();

Helpers.checkColorScheme();

function handleRoute(e) {
  document.title = 'Iris';
  activeRoute = e.url;
  if (!activeRoute && window.location.hash) {
    return route(window.location.hash.replace('#', '')); // bubblegum fix back navigation
  }
  activeProfile = activeRoute.indexOf('/profile') === 0 ? activeRoute.replace('/profile/', '') : null;
  localState.get('activeRoute').put(activeRoute);
  QRScanner.cleanupScanner();
}

class Main extends Component {
  componentDidMount() {
    localState.get('loggedIn').on(loggedIn => this.setState({loggedIn}));
  }

  render() {
    const content = this.state.loggedIn ? html`
      <${Header}/>
      <section class="main">
        <${Router} history=${createHashHistory()} onChange=${e => handleRoute(e)}>
          <${FeedView} path="/"/>
          <${ChatView} path="/chat/:id?"/>
          <${MessageView} path="/message/:hash"/>
          <${Settings} path="/settings"/>
          <${LogoutConfirmation} path="/logout"/>
          <${Profile.Profile} path="/profile/:id"/>
          <${StoreView} path="/store/:store"/>
          <${CheckoutView} path="/checkout/:store"/>
          <${ProductView} path="/product/:product/:store"/>
          <${ProductView} path="/product/new"/>
          <${FollowsView} path="/follows/:id"/>
          <${FollowsView} followers=${true} path="/followers/:id"/>
        </${Router}>
      </section>
      <${Footer}/>
      <${VideoCall}/>
    ` : html`<${Login}/>`;
    return html`
      <div id="main-content">
        ${content}
      </div>
    `;
  }
}

render(html`<${Main}/>`, document.body);

$('body').css('opacity', 1); // use opacity because setting focus on display: none elements fails

Helpers.showConsoleWarning();

$(window).resize(() => { // if resizing up from mobile size menu view
  if ($(window).width() > 565 && $('.main-view:visible').length === 0) {
    route('/');
  }
});

export {publicState, localState, activeRoute, activeProfile};
