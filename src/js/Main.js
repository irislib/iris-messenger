import { render } from './lib/preact.js';
import { Router, route } from './lib/preact-router.es.js';
import { createHashHistory } from './lib/history.production.min.js';
import { Component } from './lib/preact.js';
import { Link } from './lib/preact.match.js';

import Helpers from './Helpers.js';
import { html } from './Helpers.js';
import QRScanner from './QRScanner.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';
import { translate as t } from './Translation.js';

import Settings from './views/Settings.js';
import LogoutConfirmation from './views/LogoutConfirmation.js';
import Chat from './views/Chat.js';
import Store from './views/Store.js';
import Checkout from './views/Checkout.js';
import Product from './views/Product.js';
import Login from './views/Login.js';
import Profile from './views/Profile.js';
import Group from './views/Group.js';
import Message from './views/Message.js';
import Follows from './views/Follows.js';
import Feed from './views/Feed.js';
import About from './views/About.js';
import Explorer from './views/Explorer.js';
import Contacts from './views/Contacts.js';

import VideoCall from './components/VideoCall.js';
import Identicon from './components/Identicon.js';
import Footer from './components/Footer.js';
import State from './State.js';
import Icons from './Icons.js';

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

State.init();
Session.init({autologin: window.location.hash.length > 2});
PeerManager.init();

Helpers.checkColorScheme();

const APPLICATIONS = [ // TODO: move editable shortcuts to localState gun
  {url: '/', text: t('home'), icon: Icons.home},
  {url: '/chat', text: t('messages'), icon: Icons.chat},
  {url: '/contacts', text: t('contacts'), icon: Icons.user},
  {url: '/settings', text: t('settings'), icon: Icons.settings},
  {url: '/explorer', text: t('explorer'), icon: Icons.folder},
  {url: '/about', text: t('about')},
];

class Menu extends Component {
  componentDidMount() {
    State.local.get('unseenTotal').on(unseenTotal => {
      this.setState({unseenTotal});
    });
  }

  menuLinkClicked() {
    State.local.get('toggleMenu').put(false);
    State.local.get('scrollUp').put(true);
  }

  render() {
    const pub = Session.getPubKey();
    return html`
      <div class="application-list">
        ${iris.util.isElectron ? html`<div class="electron-padding"/>` : html`
          <a href="/" onClick=${() => this.menuLinkClicked()} class="hidden-xs" tabindex="0" class="logo">
            <img class="hidden-xs" src="img/icon128.png" width=40 height=40/>
            <img src="img/iris_logotype.png" height=23 width=41 />
          </a>
        `}
        <div class="visible-xs-block">
          <${Link} onClick=${() => this.menuLinkClicked()} activeClassName="active" href="/profile/${pub}">
            <span class="icon"><${Identicon} str=${pub} width=40/></span>
            <span class="text" style="font-size: 1.2em;border:0;margin-left: 7px;"><iris-text user="${pub}" path="profile/name" editable="false"/></span>
          <//>
          <br/><br/>
        </div>
        ${APPLICATIONS.map(a => {
          if (a.url) {
            return html`
              <${a.native ? 'a' : Link} onClick=${() => this.menuLinkClicked()} activeClassName="active" href=${a.url}>
                <span class="icon">
                  ${a.text === t('messages') && this.state.unseenTotal ? html`<span class="unseen unseen-total">${this.state.unseenTotal}</span>`: ''}
                  ${a.icon || Icons.circle}
                </span>
                <span class="text">${a.text}</span>
              <//>`;
          } else {
            return html`<br/><br/>`;
          }
        })}
      </div>
    `;
  }
}

class Main extends Component {
  componentDidMount() {
    State.local.get('loggedIn').on(loggedIn => this.setState({loggedIn}));
    State.local.get('toggleMenu').put(false);
    State.local.get('toggleMenu').on(show => this.toggleMenu(show));
    State.electron && State.electron.get('platform').on(platform => this.setState({platform}));
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

  onClickOverlay() {
    if (this.state.showMenu) {
      this.setState({showMenu: false});
    }
  }

  toggleMenu(show) {
    this.setState({showMenu: typeof show === 'undefined' ? !this.state.showMenu : show});
  }

  electronCmd(name) {
    State.electron.get('cmd').put({name, time: new Date().toISOString()});
  }

  render() {
    let content = '';
    const isDesktopNonMac = this.state.platform && this.state.platform !== 'darwin';
    if (this.state.loggedIn || window.location.hash.length <= 2) {
      content = this.state.loggedIn ? html`
        ${isDesktopNonMac ? html`
          <div class="windows-titlebar">
               <img src="img/iris_logotype.png" height=16 width=28 />
               <div class="title-bar-btns">
                    <button class="min-btn" onClick=${() => this.electronCmd('minimize')}>-</button>
                    <button class="max-btn" onClick=${() => this.electronCmd('maximize')}>+</button>
                    <button class="close-btn" onClick=${() => this.electronCmd('close')}>x</button>
               </div>
          </div>
        ` : ''}
        <section class="main ${isDesktopNonMac ? 'desktop-non-mac' : ''} ${this.state.showMenu ? 'menu-visible-xs' : ''}" style="flex-direction: row;">
          <${Menu}/>
          <div class="overlay" onClick=${e => this.onClickOverlay(e)}></div>
          <div class="view-area">
            <${Router} history=${createHashHistory()} onChange=${e => this.handleRoute(e)}>
              <${Feed} path="/"/>
              <${Feed} path="/feed"/>
              <${Login} path="/login"/>
              <${Chat} path="/chat/:id?"/>
              <${Message} path="/post/:hash"/>
              <${About} path="/about"/>
              <${Settings} path="/settings" showSwitchAccount=${true}/>
              <${LogoutConfirmation} path="/logout"/>
              <${Profile} path="/profile/:id?" tab="profile"/>
              <${Profile} path="/replies/:id?" tab="replies"/>
              <${Profile} path="/likes/:id?" tab="likes"/>
              <${Group} path="/group/:id?"/>
              <${Store} path="/store/:store?"/>
              <${Checkout} path="/checkout/:store"/>
              <${Product} path="/product/:product/:store"/>
              <${Product} path="/product/new" store=Session.getPubKey()/>
              <${Explorer} path="/explorer/:node"/>
              <${Explorer} path="/explorer"/>
              <${Follows} path="/follows/:id"/>
              <${Follows} followers=${true} path="/followers/:id"/>
              <${Contacts} path="/contacts"/>
            </${Router}>
          </div>
        </section>
        <div id="media-player-container" style="display:none">
            <div id="media-player"></div>
            <div id="close-media" onClick=${e => {
              document.getElementById('media-player').innerHTML = '';
              e.target.parentElement.style = 'display:none';
            }}>${Icons.close}</div>
        </div>
        <${Footer}/>
        <${VideoCall}/>
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
