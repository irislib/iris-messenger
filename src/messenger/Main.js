import { render } from '../js/lib/preact.js';
import { Router, route } from '../js/lib/preact-router.es.js';
import { createHashHistory } from '../js/lib/history.production.min.js';
import { Component } from '../js/lib/preact.js';

import Helpers from '../js/Helpers.js';
import { html } from '../js/Helpers.js';
import QRScanner from '../js/QRScanner.js';
import PeerManager from '../js/PeerManager.js';
import Session from '../js/Session.js';

import Chat from '../js/views/Chat.js';
import Login from '../js/views/Login.js';
import State from '../js/State.js';

const userAgent = navigator.userAgent.toLowerCase();
const isElectron = (userAgent.indexOf(' electron/') > -1);
if (!isElectron && ('serviceWorker' in navigator)) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../serviceworker.js')
    .catch(function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

State.init();
Session.init({autologin: window.location.hash.length > 2});
PeerManager.init();

Helpers.checkColorScheme();

class Main extends Component {
  componentDidMount() {
    State.local.get('loggedIn').on(loggedIn => this.setState({loggedIn}));
  }

  handleRoute(e) {
    let activeRoute = e.url;
    if (!activeRoute && window.location.hash) {
      return route(window.location.hash.replace('#', '')); // bubblegum fix back navigation
    }
    document.title = 'Iris';
    if (activeRoute && activeRoute.length > 1) { document.title += ' - ' + Helpers.capitalize(activeRoute.replace('/', '')); }
    State.local.get('activeRoute').put(activeRoute);
    QRScanner.cleanupScanner();
  }

  render() {
    let content = '';
    if (this.state.loggedIn || window.location.hash.length <= 2) {
      content = this.state.loggedIn ? html`
        <section class="main" style="flex-direction: row;">
          <div class="view-area">
            <${Router} history=${createHashHistory()} onChange=${e => this.handleRoute(e)}>
              <${Chat} path="/"/>
              <${Chat} path="/:id?"/>
              <${Chat} path="/chat/:id?"/>
            </${Router}>
          </div>
        </section>
      ` : html`<${Login}/>`;
    }
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
