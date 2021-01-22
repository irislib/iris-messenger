import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {chats, getDisplayName} from '../Chat.js';
import { translate as t } from '../Translation.js';
import State from '../State.js';
import Session from '../Session.js';
import { route } from '../lib/preact-router.es.js';
import Identicon from './Identicon.js';
import SearchBox from './SearchBox.js';
import Icons from '../Icons.js';

class Header extends Component {
  constructor() {
    super();
    this.state = {latest: {}};
    this.eventListeners = [];
    this.chatId = null;
  }

  getOnlineStatusText() {
    const chat = chats[this.chatId];
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
        return (t('last_active') + ' ' + lastSeenText);
      }
    }
  }

  backButtonClicked() {
    route('/chat');
  }

  onClick() {
    if (this.chatId) {
      route('/profile/' + this.chatId);
    }
  }

  componentDidMount() {
    State.local.get('unseenTotal').on(unseenTotal => {
      this.setState({unseenTotal});
    });
    State.local.get('activeRoute').on(activeRoute => {
      this.eventListeners.forEach(e => e.off());
      this.eventListeners = [];
      this.setState({activeRoute});
      const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
      this.chatId = replaced.length < activeRoute.length ? replaced : null;
      if (this.chatId) {
        State.local.get('chats').get(this.chatId).get('isTyping').on((isTyping, a, b, event) => {
          this.eventListeners.push(event);
          this.setState({});
        });
        State.local.get('chats').get(this.chatId).get('theirLastActiveTime').on((t, a, b, event) => {
          this.eventListeners.push(event);
          this.setState({});
        });
      }

      let title = '';
      if (activeRoute.indexOf('/chat/') === 0) {
        if (activeRoute.indexOf('/chat/') === 0 && Session.getKey() && this.chatId === Session.getKey().pub) {
          title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
        } else {
          title = getDisplayName(this.chatId);
          if (!title && this.chatId.length > 40) {
            State.public.user(this.chatId).get('profile').get('name').on((name, a, b, eve) => {
              this.eventListeners.push(eve);
              this.setState({title: name});
            });
          }
        }
      }
      this.setState({title});
    });
  }

  onTitleClicked() {
    this.chatId && route('/profile/' + this.chatId);

  }

  onLogoClick(e) {
    e.preventDefault();
    e.stopPropagation();
    $('a.logo').blur();
    ($(window).width() > 575) && route('/');
    this.props.toggleMenu();
  }

  render() {
    const activeRoute = this.state.activeRoute;
    const chat = chats[this.chatId];
    const isTyping = chat && chat.isTyping;
    const participants = chat && chat.uuid && Object.keys(chat.participantProfiles).map(p => chat.participantProfiles[p].name).join(', ');
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const key = Session.getKey().pub;
    const searchBox = this.chatId ? '' : html`<${SearchBox}/>`;

    return html`
    <header class="nav header">
      ${activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
      </div>
      ` : ''}
      <div class="header-content">
        <a href="/" onClick=${e => this.onLogoClick(e)} tabindex="0" class="${activeRoute && activeRoute.indexOf('/chat/') === 0 ? 'hidden-xs' :'' } logo">
          <img src="img/icon128.png" width=40 height=40/>
          <img src="img/iris_logotype.png" height=23 width=41 />
        </a>
        <div class="text" style=${this.chatId ? 'cursor:pointer' : ''} onClick=${() => this.onTitleClicked()}>
          ${this.state.title && activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
            <div class="name">
              ${this.state.title}
            </div>
          `: ''}
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${participants ? html`<small class="participants">${participants}</small>` : ''}
          ${this.chatId ? html`<small class="last-seen">${onlineStatus || ''}</small>` : ''}
          ${searchBox}
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

        <a href="/" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute === '/' ? 'active' : ''}">${Icons.home}</a>
        <a href="/chat" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute.indexOf('/chat') === 0 ? 'active' : ''}">
          ${this.state.unseenTotal ? html`<span class="unseen unseen-total">${this.state.unseenTotal}</span>`: ''}
          ${Icons.chat}
        </a>
        <a href="/settings" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute === '/settings' ? 'active' : ''}">${Icons.settings}</a>
        <a href="/profile/${key}" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs ${activeRoute && activeRoute === '/profile/' + key ? 'active' : ''} my-profile">
          <${Identicon} str=${key} width=34 />
        </a>
      </div>
    </header>`;
  }
}

export default Header;
