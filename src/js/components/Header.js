import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
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
        return (t('last_active') + ' ' + lastSeenText);
      }
    }
  }

  backButtonClicked() {
    route('/chat');
  }

  componentDidMount() {
    State.local.get('showParticipants').on(showParticipants => this.setState({showParticipants}));
    State.local.get('unseenTotal').on(unseenTotal => {
      this.setState({unseenTotal});
    });
    State.local.get('activeRoute').on(activeRoute => {
      this.setState({about:null, title: ''});
      this.eventListeners.forEach(e => e.off());
      this.eventListeners = [];
      this.setState({activeRoute});
      const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
      this.chatId = replaced.length < activeRoute.length ? replaced : null;
      if (this.chatId) {
        State.local.get('channels').get(this.chatId).get('isTyping').on((isTyping, a, b, event) => {
          this.eventListeners.push(event);
          this.setState({});
        });
        State.local.get('channels').get(this.chatId).get('theirLastActiveTime').on((t, a, b, event) => {
          this.eventListeners.push(event);
          this.setState({});
        });
      }

      if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
        if (activeRoute.indexOf('/chat/') === 0 && Session.getKey() && this.chatId === Session.getKey().pub) {
          const title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
          this.setState({title});
        } else {
          State.local.get('channels').get(this.chatId).get('name').on((name, a, b, eve) => {
            this.eventListeners.push(eve);
            this.setState({title: name});
          });
          State.local.get('channels').get(this.chatId).get('about').on((about, a, b, eve) => {
            this.eventListeners.push(eve);
            this.setState({about});
          });
        }
      }
    });
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
    const activeRoute = this.state.activeRoute;
    const chat = Session.channels[this.chatId];
    const isTyping = chat && chat.isTyping;
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const key = Session.getPubKey();
    const searchBox = this.chatId ? '' : html`<${SearchBox}/>`;

    return html`
    <header class="nav header">
      ${activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
      </div>
      ` : ''}
      <div class="header-content">
        ${iris.util.isElectron || (activeRoute && activeRoute.indexOf('/chat/') === 0) ? '' : html`
          <a href="/" onClick=${e => this.onLogoClick(e)} tabindex="0" class="visible-xs-flex logo">
            <img src="/img/icon128.png" width=40 height=40/>
            <img src="/img/iris_logotype.png" height=23 width=41 />
          </a>
        `}
        <div class="text" style=${this.chatId ? 'cursor:pointer' : ''} onClick=${() => this.onTitleClicked()}>
          ${this.state.title && activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
            <div class="name">
              ${this.state.title}
            </div>
          `: ''}
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${this.state.about ? html`<small class="participants">${this.state.about}</small>` : ''}
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
        ${this.chatId && this.chatId.length > 10 && this.chatId.length < 40 ? html`
          <a class="tooltip hidden-xs" onClick=${() => State.local.get('showParticipants').put(!this.state.showParticipants)}>
            <span class="tooltiptext">${t('participant_list')}</span>
            ${Icons.group}
          </a>
        ` : ''}
        <a href="/profile/${key}" onClick=${() => State.local.get('scrollUp').put(true)} class="hidden-xs ${activeRoute && activeRoute === '/profile/' + key ? 'active' : ''} my-profile">
          <${Identicon} str=${key} width=34 />
        </a>
      </div>
    </header>`;
  }
}

export default Header;
