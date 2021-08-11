import Component from './BaseComponent';
import { Router } from 'preact-router';
import {Helmet} from "react-helmet";

import Helpers from './Helpers.js';
import { html } from 'htm/preact';
import QRScanner from './QRScanner.js';
import PeerManager from './PeerManager.js';
import Session from './Session.js';

import Settings from './views/settings/Settings.js';
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
import Torrent from './views/Torrent.js';

import Menu from './components/Menu.js';
import VideoCall from './components/VideoCall.js';
import MediaPlayer from './components/MediaPlayer.js';
import Footer from './components/Footer.js';
import State from './State.js';

import logoType from '../assets/img/iris_logotype.png';

import '../css/style.css';
import '../css/cropper.min.css';

if (window.location.hash && window.location.hash.indexOf('#/') === 0) { // redirect old urls
  window.location.href = window.location.href.replace('#/', '');
}

State.init();
Session.init({autologin: window.location.pathname.length > 2});
PeerManager.init();

Helpers.checkColorScheme();

class Main extends Component {
  componentDidMount() {
    State.local.get('loggedIn').on(this.inject());
    State.local.get('toggleMenu').put(false);
    State.local.get('toggleMenu').on(show => this.toggleMenu(show));
    State.electron && State.electron.get('platform').on(this.inject());
    State.local.get('unseenTotal').on(this.inject());
  }

  handleRoute(e) {
    let activeRoute = e.url;
    this.setState({activeRoute});
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
    let title = "";
    const s = this.state;
    if (s.activeRoute && s.activeRoute.length > 1) {
      title = Helpers.capitalize(s.activeRoute.replace('/', ''));
    }
    let content = '';
    const isDesktopNonMac = s.platform && s.platform !== 'darwin';
    const titleTemplate = s.unseenTotal ? `(${s.unseenTotal}) %s | Iris` : "%s | Iris";
    const defaultTitle = s.unseenTotal ? `(${s.unseenTotal}) Iris` : 'Iris';
    if (s.loggedIn || window.location.pathname.length <= 2) {
      content = s.loggedIn ? html`
        ${isDesktopNonMac ? html`
          <div class="windows-titlebar">
               <img src=${logoType} height=16 width=28 />
               <div class="title-bar-btns">
                    <button class="min-btn" onClick=${() => this.electronCmd('minimize')}>-</button>
                    <button class="max-btn" onClick=${() => this.electronCmd('maximize')}>+</button>
                    <button class="close-btn" onClick=${() => this.electronCmd('close')}>x</button>
               </div>
          </div>
        ` : ''}
        <section class="main ${isDesktopNonMac ? 'desktop-non-mac' : ''} ${s.showMenu ? 'menu-visible-xs' : ''}" style="flex-direction: row;">
          <${Menu}/>
          <${Helmet} titleTemplate=${titleTemplate} defaultTitle=${defaultTitle}>
            <title>${title}</title>
            <meta name="description" content="Social Networking Freedom" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content=${title} />
            <meta property="og:description" content="Social Networking Freedom" />
            <meta property="og:url" content=${`https://iris.to${window.location.pathname.length > 1 ? window.location.pathname : ''}`} />
            <meta property="og:image" content="https://iris.to/assets/img/cover.jpg" />
          <//>
          <div class="overlay" onClick=${e => this.onClickOverlay(e)}></div>
          <div class="view-area">
            <${Router} onChange=${e => this.handleRoute(e)}>
              <${Feed} path="/"/>
              <${Feed} path="/feed"/>
              <${Feed} path="/search/:term?/:type?"/>
              <${Feed} path="/media" index="media" thumbnails=${true}/>
              <${Login} path="/login"/>
              <${Chat} path="/chat/:id?"/>
              <${Message} path="/post/:hash+"/>
              <${Torrent} path="/torrent/:id+"/>
              <${About} path="/about"/>
              <${Settings} path="/settings"/>
              <${LogoutConfirmation} path="/logout"/>
              <${Profile} path="/profile/:id+" tab="profile"/>
              <${Profile} path="/replies/:id+" tab="replies"/>
              <${Profile} path="/likes/:id+" tab="likes"/>
              <${Profile} path="/media/:id+" tab="media"/>
              <${Group} path="/group/:id+"/>
              <${Store} path="/store/:store?"/>
              <${Checkout} path="/checkout/:store?"/>
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
        <${MediaPlayer}/>
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

Helpers.showConsoleWarning();

export default Main;