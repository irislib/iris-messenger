import Component from '../BaseComponent';
import Helpers from '../Helpers';
import { html } from 'htm/preact';
import { translate as t } from '../translations/Translation';
import State from '../State';
import Session from '../Session';
import { route } from 'preact-router';
import Identicon from './Identicon';
import SearchBox from './SearchBox';
import Icons from '../Icons';
import iris from 'iris-lib';
import {Link} from "preact-router/match";

import $ from 'jquery';
import _ from "lodash";

class Header extends Component {
  constructor() {
    super();
    this.state = {latest: {}, topicPeerCount: 0};
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
    clearInterval(this.iv);
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
          State.local.get('channels').get(this.chatId).get('isTyping').on(this.inject());
          State.local.get('channels').get(this.chatId).get('theirLastActiveTime').on(this.inject());
        }

        if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
          if (activeRoute.indexOf('/chat/') === 0 && Session.getKey() && this.chatId === Session.getKey().pub) {
            const title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
            this.setState({title});
          } else if (activeRoute.indexOf('/chat/hashtag/') === 0) {
            this.setState({title: `#${activeRoute.replace('/chat/hashtag/','')}`, about: 'Public'})
          } else {
            State.local.get('channels').get(this.chatId).get('name').on(this.inject('title'));
            State.local.get('channels').get(this.chatId).get('about').on(this.inject());
          }
        }
      }
    ));
    this.updatePeersFromGun();
    this.iv = setInterval(() => this.updatePeersFromGun(), 1000);
  }

  onTitleClicked() {
    if (this.chatId && this.chatId.indexOf('hashtag') === -1) {
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

  updatePeersFromGun() {
    const peersFromGun = State.public.back('opt.peers') || {};
    const connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
      if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
        console.log('WebRTC peer', peer);
      }
      return peer && peer.wire && peer.wire.readyState === 1  && peer.wire.bufferedAmount === 0 && peer.wire.constructor.name === 'WebSocket';
    });
    this.setState({connectedPeers});
  }

  render() {
    const key = Session.getPubKey();
    if (!key) { return; }
    const activeRoute = this.state.activeRoute;
    const chat = Session.channels[this.chatId];
    const isTyping = chat && chat.isTyping;
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const searchBox = this.chatId ? '' : html`
        <${SearchBox} onSelect=${item => route(item.uuid ? `/chat/${item.uuid}` : `/profile/${item.key}`)} />
    `;
    const chatting = (activeRoute && activeRoute.indexOf('/chat/') === 0);

    const peerCount = (this.state.connectedPeers ? this.state.connectedPeers.length : 0) + this.state.topicPeerCount;

    return html`
    <header class="nav header">
      ${activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
      </div>
      ` : ''}
      <div class="header-content">
        <div class="mobile-search-hidden ${this.state.showMobileSearch ? 'hidden-xs':''}">
          ${Helpers.isElectron || chatting ? '' : html`
            <a href="/" onClick=${e => this.onLogoClick(e)} class="visible-xs-flex logo">
              <div class="mobile-menu-icon">${Icons.menu}</div>
            </a>
          `}
        </div>
        ${chatting ? '' : html`
          <a class="mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}" href="" onClick=${e => {
            e.preventDefault();
            this.setState({showMobileSearch: false})
          }}>
            <span class="visible-xs-inline-block">${Icons.backArrow}</span>
          </a>
        `}
        <a href="/settings/peer" class="connected-peers tooltip mobile-search-hidden ${this.state.showMobileSearch ? 'hidden-xs' : ''} ${peerCount ? 'connected' : ''}">
          <span class="tooltiptext">${t('connected_peers')}</span>
          <small>
            <span class="icon">${Icons.network}</span>
            <span>${peerCount}</span>
          </small>
        </a>
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
            <div id="mobile-search" class="mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}">
              ${searchBox}
            </div>
            <div id="mobile-search-btn" class="mobile-search-hidden ${this.state.showMobileSearch ? 'hidden' : 'visible-xs-inline-block'}" onClick=${() => {
                // also synchronously make element visible so it can be focused
                $('.mobile-search-visible').removeClass('hidden-xs hidden');
                $('.mobile-search-hidden').removeClass('visible-xs-inline-block').addClass('hidden');
                const input = document.querySelector('.search-box input');
                input && input.focus();
                this.setState({showMobileSearch: true});
            }}>
              ${Icons.search}
            </div>
          `}
        </div>

        ${chat && this.chatId !== key && !chat.uuid ? html`
          <a class="tooltip" style="width:24px; height:24px; color: var(--msg-form-button-color)" id="<start-video-call" onClick=${() => State.local.get('outgoingCall').put(this.chatId)}>
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
             class="notifications-button mobile-search-hidden ${this.state.showMobileSearch ? 'hidden' : ''}">
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
