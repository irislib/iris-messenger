import Component from './BaseComponent';
import { Router } from 'preact-router';
import { createHashHistory } from 'history';
import {Helmet} from "react-helmet";

import Helpers from './Helpers';
import { html } from 'htm/preact';
import QRScanner from './QRScanner';
import PeerManager from './PeerManager';
import Session from './Session';

import Settings from './views/settings/Settings';
import LogoutConfirmation from './views/LogoutConfirmation';
import Chat from './views/chat/Chat';
import Notifications from './views/Notifications';
import Hashtags from './views/Hashtags';
import Store from './views/Store';
import Checkout from './views/Checkout';
import Product from './views/Product';
import Login from './views/Login';
import Profile from './views/Profile';
import Group from './views/Group';
import Message from './views/Message';
import Follows from './views/Follows';
import Feed from './views/Feed';
import About from './views/About';
import Explorer from './views/Explorer';
import Contacts from './views/Contacts';
import Torrent from './views/Torrent';

import Menu from './components/Menu';
import VideoCall from './components/VideoCall';
import MediaPlayer from './components/MediaPlayer';
import Footer from './components/Footer';
import State from './State';

import logoType from '../assets/img/iris_logotype.png';

import '../css/style.css';
import '../css/cropper.min.css';

if (window.location.host === 'iris.to' && window.location.pathname !== '/') {
  window.location.href = window.location.href.replace(window.location.pathname, '/');
}

class Main extends Component {
  componentDidMount() {
    State.init();
    Session.init({autologin: window.location.hash.length > 2});
    PeerManager.init();

    State.local.get('loggedIn').on(this.inject());
    State.local.get('toggleMenu').put(false);
    State.local.get('toggleMenu').on(show => this.toggleMenu(show));
    State.electron && State.electron.get('platform').on(this.inject());
    State.local.get('unseenMsgsTotal').on(this.inject());
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
    const titleTemplate = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) %s | Iris` : "%s | Iris";
    const defaultTitle = s.unseenMsgsTotal ? `(${s.unseenMsgsTotal}) Iris` : 'Iris';
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
            <meta property="og:url" content=${`https://iris.to/${window.location.hash}`} />
            <meta property="og:image" content="https://iris.to/assets/img/cover.jpg" />
            <meta name="twitter:card" content="summary_large_image" />
          <//>
          <div class="overlay" onClick=${e => this.onClickOverlay(e)}></div>
          <div class="view-area">
            <${Router} history=${createHashHistory()} onChange=${e => this.handleRoute(e)}>
              <${Feed} path="/"/>
              <${Feed} path="/feed"/>
              <${Hashtags} path="/hashtag"/>
              <${Feed} path="/hashtag/:hashtag+"/>
              <${Feed} path="/search/:term?/:type?"/>
              <${Feed} path="/media" index="media" thumbnails=${true}/>
              <${Login} path="/login"/>
              <${Notifications} path="/notifications"/>
              <${Chat} path="/chat/hashtag/:hashtag?"/>
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