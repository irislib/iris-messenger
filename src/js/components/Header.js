import Component from '../BaseComponent';
import Helpers from '../Helpers.js';
import { html } from 'htm/preact';
import { translate as t } from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import { route } from 'preact-router';
import Identicon from './Identicon.js';
import SearchBox from './SearchBox.js';
import Icons from '../Icons.js';
import iris from 'iris-lib';
import {Link} from "preact-router/match";

import logo from '../../assets/img/icon128.png';
import logoType from '../../assets/img/iris_logotype.png';

import $ from 'jquery';

class Header extends Component {
  constructor() {
    super();
    this.state = {latest: {}};
    this.chatId = null;
    this.escFunction = this.escFunction.bind(this);
  }

  escFunction(event){
    if(event.keyCode === 27) {
      this.state.showMobileSearch && this.setState({showMobileSearch: false});
    }
  }

  getOnlineStatusText() {
    const chat = Session.channels[this.chatId];
    const activity = chat && chat.activity;
    if (activity) {
      if (activity.isActive) {
        return(t('online'));
      } else if (activity.lastActive) {
        const d = new Date(activity.lastActive);
        let lastSeenText = t(iris.util.getDaySeparatorText(d, d.toLocaleDateString({dateStyle:'short'})));
        if (lastSeenText === t('today')) {
          lastSeenText = iris.util.formatTime(d);
        } else {
          lastSeenText = iris.util.formatDate(d);
        }
        return (`${t('last_active')  } ${  lastSeenText}`);
      }
    }
  }

  backButtonClicked() {
    route('/chat');
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    document.removeEventListener("keydown", this.escFunction, false);
  }

  componentDidMount() {
    document.addEventListener("keydown", this.escFunction, false);
    State.local.get('showParticipants').on(this.inject());
    State.local.get('unseenMsgsTotal').on(this.inject());
    State.local.get('unseenNotificationCount').on(this.inject());
    State.local.get('activeRoute').on(this.sub(
      activeRoute => {
        this.setState({about:null, title: '', activeRoute, showMobileSearch: false});
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        this.chatId = replaced.length < activeRoute.length ? replaced : null;
        if (this.chatId) {
          State.local.get('channels').get(this.chatId).get('isTyping').on(this.sub(
            () => this.setState({})
          ));
          State.local.get('channels').get(this.chatId).get('theirLastActiveTime').on(this.sub(
            () => this.setState({})
          ));
        }

        if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
          if (activeRoute.indexOf('/chat/') === 0 && Session.getKey() && this.chatId === Session.getKey().pub) {
            const title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
            this.setState({title});
          } else {
            State.local.get('channels').get(this.chatId).get('name').on(this.inject('title'));
            State.local.get('channels').get(this.chatId).get('about').on(this.inject());
          }
        }
      }
    ));
  }

  onTitleClicked() {
    if (this.chatId) {
      const view = this.chatId.length < 40 ? '/group/' : '/profile/';
      route(view + this.chatId);
    }
  }

  onLogoClick(e) {
    e.preventDefault();
    e.stopPropagation();
    $('a.logo').blur();
    ($(window).width() > 625) && route('/');
    State.local.get('toggleMenu').put(true);
  }

  render() {
    const key = Session.getPubKey();
    if (!key) { return; }
    const activeRoute = this.state.activeRoute;
    const chat = Session.channels[this.chatId];
    const isTyping = chat && chat.isTyping;
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const searchBox = this.chatId ? '' : html`
        <${SearchBox} focus=${!!this.state.showMobileSearch}/>
    `;
    const chatting = (activeRoute && activeRoute.indexOf('/chat/') === 0);

    return html`
    <header class="nav header">
      ${activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
      </div>
      ` : ''}
      <div class="header-content">
        <div class=${this.state.showMobileSearch ? 'hidden-xs':''}>
          ${Helpers.isElectron || chatting ? '' : html`
            <a href="/" onClick=${e => this.onLogoClick(e)} tabindex="0" class="visible-xs-flex logo">
              <div class="mobile-menu-icon">${Icons.menu}</div>
              <img src=${logo} style="margin-right: 10px" width=30 height=30/>
              <img src=${logoType} height=23 width=41 />
            </a>
          `}
        </div>
        ${chatting ? '' : html`
          <a class=${this.state.showMobileSearch ? '' : 'hidden-xs'} href="" onClick=${e => {
            e.preventDefault();
            this.setState({showMobileSearch: false})
          }}>
            <span class="visible-xs-inline-block">${Icons.backArrow}</span>
          </a>
        `}
        <div class="text" style=${this.chatId ? 'cursor:pointer;text-align:center' : ''} onClick=${() => this.onTitleClicked()}>
          ${this.state.title && chatting ? html`
            <div class="name">
              ${this.state.title}
            </div>
          `: ''}
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${this.state.about ? html`<small class="participants">${this.state.about}</small>` : ''}
          ${this.chatId ? html`<small class="last-seen">${onlineStatus || ''}</small>` : ''}
          ${chatting ? '':html`
            <div class=${this.state.showMobileSearch ? '' : 'hidden-xs'}>
              ${searchBox}
            </div>
            <div class="mobile-search-btn ${this.state.showMobileSearch ? 'hidden' : 'visible-xs-inline-block'}" onClick=${() => {
                this.setState({showMobileSearch: true});
            }}>
              ${Icons.search}
            </div>
          `}
        </div>

        ${chat && this.chatId !== key && !chat.uuid ? html`
          <a class="tooltip" style="width:24px; height:24px; color: var(--msg-form-button-color)" id="start-video-call" onClick=${() => State.local.get('outgoingCall').put(this.chatId)}>
            <span class="tooltiptext">${t('video_call')}</span>
            ${Icons.videoCall}
          </a>
          <!-- <a id="start-voice-call" style="width:20px; height:20px; margin-right: 20px">
            Icons.voiceCall
            </a> -->
        `: ''}
        ${this.chatId && this.chatId.length > 10 && this.chatId.length < 40 ? html`
          <a class="tooltip hidden-xs" onClick=${() => State.local.get('showParticipants').put(!this.state.showParticipants)}>
            <span class="tooltiptext">${t('participant_list')}</span>
            ${Icons.group}
          </a>
        ` : ''}
        <${Link} activeClassName="active"
             href="/notifications"
             style="margin-left: 22px;"
             class="notifications-button ${this.state.showMobileSearch ? 'hidden' : ''}">
          ${Icons.heartEmpty}
          ${this.state.unseenNotificationCount ? html`
            <span class="unseen">${this.state.unseenNotificationCount}</span>
          ` : ''}
        <//>
        <${Link} activeClassName="active" href="/profile/${key}" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs my-profile">
          <${Identicon} str=${key} width=34 />
        <//>
      </div>
    </header>`;
  }
}

export default Header;
