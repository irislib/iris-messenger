import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {chats, getDisplayName} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState, activeRoute, publicState} from '../Main.js';
import Session from '../Session.js';
import { route } from '../lib/preact-router.es.js';
import Identicon from './Identicon.js';
import SearchBox from './SearchBox.js';

const settingsIcon = html`<svg version="1.1" x="0px" y="0px" width="25px" height="25.001px" viewBox="0 0 25 25.001" style="enable-background:new 0 0 25 25.001;" xml:space="preserve">
<g><path fill="currentColor" d="M24.38,10.175l-2.231-0.268c-0.228-0.851-0.562-1.655-0.992-2.401l1.387-1.763c0.212-0.271,0.188-0.69-0.057-0.934 l-2.299-2.3c-0.242-0.243-0.662-0.269-0.934-0.057l-1.766,1.389c-0.743-0.43-1.547-0.764-2.396-0.99L14.825,0.62 C14.784,0.279,14.469,0,14.125,0h-3.252c-0.344,0-0.659,0.279-0.699,0.62L9.906,2.851c-0.85,0.227-1.655,0.562-2.398,0.991 L5.743,2.455c-0.27-0.212-0.69-0.187-0.933,0.056L2.51,4.812C2.268,5.054,2.243,5.474,2.456,5.746L3.842,7.51 c-0.43,0.744-0.764,1.549-0.991,2.4l-2.23,0.267C0.28,10.217,0,10.532,0,10.877v3.252c0,0.344,0.279,0.657,0.621,0.699l2.231,0.268 c0.228,0.848,0.561,1.652,0.991,2.396l-1.386,1.766c-0.211,0.271-0.187,0.69,0.057,0.934l2.296,2.301 c0.243,0.242,0.663,0.269,0.933,0.057l1.766-1.39c0.744,0.43,1.548,0.765,2.398,0.991l0.268,2.23 c0.041,0.342,0.355,0.62,0.699,0.62h3.252c0.345,0,0.659-0.278,0.699-0.62l0.268-2.23c0.851-0.228,1.655-0.562,2.398-0.991 l1.766,1.387c0.271,0.212,0.69,0.187,0.933-0.056l2.299-2.301c0.244-0.242,0.269-0.662,0.056-0.935l-1.388-1.764 c0.431-0.744,0.764-1.548,0.992-2.397l2.23-0.268C24.721,14.785,25,14.473,25,14.127v-3.252 C25.001,10.529,24.723,10.216,24.38,10.175z M12.501,18.75c-3.452,0-6.25-2.798-6.25-6.25s2.798-6.25,6.25-6.25 s6.25,2.798,6.25,6.25S15.954,18.75,12.501,18.75z"/></g></svg>`;

const homeIcon = html`<svg fill="currentColor" viewBox="0 0 48 48" width="24px" height="24px"><path d="M39.5,43h-9c-1.381,0-2.5-1.119-2.5-2.5v-9c0-1.105-0.895-2-2-2h-4c-1.105,0-2,0.895-2,2v9c0,1.381-1.119,2.5-2.5,2.5h-9	C7.119,43,6,41.881,6,40.5V21.413c0-2.299,1.054-4.471,2.859-5.893L23.071,4.321c0.545-0.428,1.313-0.428,1.857,0L39.142,15.52	C40.947,16.942,42,19.113,42,21.411V40.5C42,41.881,40.881,43,39.5,43z"/></svg>`;

const videoCallIcon = html`<svg enable-background="new 0 0 50 50" id="Layer_1" version="1.1" viewBox="0 0 50 50"><rect fill="none" style="height:24px;width:24px"/><polygon fill="none" points="49,14 36,21 36,29   49,36 " stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M36,36c0,2.209-1.791,4-4,4  H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/></svg>`;

//const voiceCallIcon = html`<svg enable-background="new 0 0 50 50" style="height:20px;width:20px" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" height="50" width="50"/><path d="M30.217,35.252c0,0,4.049-2.318,5.109-2.875  c1.057-0.559,2.152-0.7,2.817-0.294c1.007,0.616,9.463,6.241,10.175,6.739c0.712,0.499,1.055,1.924,0.076,3.32  c-0.975,1.396-5.473,6.916-7.379,6.857c-1.909-0.062-9.846-0.236-24.813-15.207C1.238,18.826,1.061,10.887,1,8.978  C0.939,7.07,6.459,2.571,7.855,1.595c1.398-0.975,2.825-0.608,3.321,0.078c0.564,0.781,6.124,9.21,6.736,10.176  c0.419,0.66,0.265,1.761-0.294,2.819c-0.556,1.06-2.874,5.109-2.874,5.109s1.634,2.787,7.16,8.312  C27.431,33.615,30.217,35.252,30.217,35.252z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="4"/></svg>`;

const chatIcon = html`<svg class="svg-inline--fa fa-w-16" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;width: 1em;" width="100px" height="100px" fill="currentColor" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>`;

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
    localState.get('unseenTotal').on(unseenTotal => {
      this.setState({unseenTotal});
    });
    localState.get('activeRoute').on(activeRoute => {
      this.eventListeners.forEach(e => e.off());
      this.eventListeners = [];
      this.setState({});
      const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
      this.chatId = replaced.length < activeRoute.length ? replaced : null;
      if (this.chatId) {
        localState.get('chats').get(this.chatId).get('isTyping').on((isTyping, a, b, event) => {
          this.eventListeners.push(event);
          this.setState({});
        });
        localState.get('chats').get(this.chatId).get('theirLastActiveTime').on((t, a, b, event) => {
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
            publicState.user(this.chatId).get('profile').get('name').on((name, a, b, eve) => {
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

  render() {
    const chat = chats[this.chatId];
    const isTyping = chat && chat.isTyping;
    const participants = chat && chat.uuid && Object.keys(chat.participantProfiles).map(p => chat.participantProfiles[p].name).join(', ');
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const key = Session.getKey().pub;
    const searchBox = this.chatId ? '' : html`<${SearchBox}/>`;

    return html`
    <header>
      ${activeRoute && activeRoute.indexOf('/chat/') === 0 ? html`
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
      </div>
      ` : ''}
      <div class="header-content">
        <a href="/" onClick=${() => {$('a.logo').blur();localState.get('scrollUp').put(true)}} tabindex="0" class="${activeRoute && activeRoute.indexOf('/chat/') === 0 ? 'hidden-xs' :'' } logo">
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
          <a class="tooltip" style="width:24px; height:24px; color: var(--msg-form-button-color)" id="start-video-call" onClick=${() => localState.get('outgoingCall').put(this.chatId)}>
            <span class="tooltiptext">${t('video_call')}</span>
            ${videoCallIcon}
          </a>
          <!-- <a id="start-voice-call" style="width:20px; height:20px; margin-right: 20px">
            voiceCallIcon
            </a> -->
        `: ''}

        <a href="/" onClick=${() => localState.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute === '/' ? 'active' : ''}">${homeIcon}</a>
        <a href="/chat" onClick=${() => localState.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute.indexOf('/chat') === 0 ? 'active' : ''}">
          ${this.state.unseenTotal ? html`<span class="unseen unseen-total">${this.state.unseenTotal}</span>`: ''}
          ${chatIcon}
        </a>
        <a href="/settings" onClick=${() => localState.get('scrollUp').put(true)} class="hidden-xs btn ${activeRoute && activeRoute === '/settings' ? 'active' : ''}">${settingsIcon}</a>
        <a href="/profile/${key}" onClick=${() => localState.get('scrollUp').put(true)} class="hidden-xs ${activeRoute && activeRoute === '/profile/' + key ? 'active' : ''} my-profile">
          <${Identicon} str=${key} width=34 />
        </a>
      </div>
    </header>`;
  }
}

export default Header;
