import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import {chats, getDisplayName} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState, resetView, showMenu, activeRoute} from '../Main.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import { route } from '../lib/preact-router.es.js';

class Header extends Component {
  constructor() {
    super();
    this.state = {latest: {}};
    this.eventListeners = [];
    this.chatId = null;
  }

    /* disabled for now because videochat is broken
    addUserToHeader() {
    if (!chats[pub].uuid) {
      var videoCallBtn = $(`<a class="tooltip"><span class="tooltiptext">${t('video_call')}</span><svg enable-background="new 0 0 50 50" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" style="height:24px;width:24px"/><polygon fill="none" points="49,14 36,21 36,29   49,36 " stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/><path d="M36,36c0,2.209-1.791,4-4,4  H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="4"/></svg></a>`).attr('id', 'start-video-call').css({width:24, height:24, color: 'var(--msg-form-button-color)'});
      videoCallBtn.click(() => VideoCall.isCalling() ? null : VideoCall.callUser(pub));
      var voiceCallBtn = $('<a><svg enable-background="new 0 0 50 50" style="height:20px;width:20px" id="Layer_1" version="1.1" viewBox="0 0 50 50" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="none" height="50" width="50"/><path d="M30.217,35.252c0,0,4.049-2.318,5.109-2.875  c1.057-0.559,2.152-0.7,2.817-0.294c1.007,0.616,9.463,6.241,10.175,6.739c0.712,0.499,1.055,1.924,0.076,3.32  c-0.975,1.396-5.473,6.916-7.379,6.857c-1.909-0.062-9.846-0.236-24.813-15.207C1.238,18.826,1.061,10.887,1,8.978  C0.939,7.07,6.459,2.571,7.855,1.595c1.398-0.975,2.825-0.608,3.321,0.078c0.564,0.781,6.124,9.21,6.736,10.176  c0.419,0.66,0.265,1.761-0.294,2.819c-0.556,1.06-2.874,5.109-2.874,5.109s1.634,2.787,7.16,8.312  C27.431,33.615,30.217,35.252,30.217,35.252z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="4"/></svg></a>').css({width:20, height:20, 'margin-right': 20});
      voiceCallBtn.click(() => VideoCall.isCalling() ? VideoCall.stopCalling(pub) : VideoCall.callUser(pub));
      //$("#header-content").append(voiceCallBtn);
      $("#header-content").append(videoCallBtn);
      }
    }*/

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
    resetView();
    showMenu(true);
  }

  onClick() {
    if (activeRoute && activeRoute.length > 20 && activeRoute.indexOf('/profile') !== 0) {
      route('/profile/' + activeRoute.replace('/chat/', ''));
    }
  }

  componentDidUpdate() {
    $('#header-content .identicon-container').remove();
    const chat = chats[this.chatId];
    if (chat) {
      if (chat.photo) {
        const photo = Helpers.setImgSrc($('<img>'), chat.photo).attr('height', 40).attr('width', 40).css({'border-radius': '50%'});
        $('#header-content').prepend($('<div class="identicon-container">').append(photo));
      } else if (activeRoute !== '/chat/public' && chat.identicon) {
        const el = chat.identicon.clone(); // TODO use actual identicon element to update in real-time. but unsubscribe on unmount.
        el.css({width:40, height:40});
        el.find('img').attr({width:40, height:40});
        $('#header-content').prepend($('<div class="identicon-container">').append(el));
      }
    }
    $(this.base).css({cursor: chat ? 'pointer' : ''});
  }

  componentDidMount() {
    localState.get('activeRoute').on(activeRoute => {
      this.eventListeners.forEach(e => e.off());
      this.eventListeners = [];
      this.setState({});
      this.chatId = activeRoute && activeRoute.indexOf('/chat/') === 0 ? activeRoute.replace('/chat/', '') : null;
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
    });
  }

  render() {
    const chat = chats[this.chatId];
    const isTyping = chat && chat.isTyping;
    const participants = chat && chat.uuid && Object.keys(chat.participantProfiles).map(p => chat.participantProfiles[p].name).join(', ');
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    let title;
    if (!activeRoute) {
      title = t('new_chat');
    } else if (activeRoute === '/chat/public') {
      title = t('public_messages');
    } else if (activeRoute === '/settings') {
      title = t('settings');
    } else if (activeRoute === '/logout') {
      title = t('log_out') + '?';
    } else if (activeRoute.length > 20) {
      if (activeRoute === Session.getKey().pub) {
        title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
      } else {
        title = getDisplayName(activeRoute.replace('/profile/', '').replace('/chat/', ''));
      }
    }

    return html`
    <header>
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
        <span class="unseen unseen-total"></span>
      </div>
      <div id="header-content" onClick="${e => this.onClick(e)}">
        <div class="text">
          <div class="name">
            ${title}
          </div>
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${participants ? html`<small class="participants">${participants}</small>` : ''}
          ${onlineStatus ? html`<small class="last-seen">${onlineStatus}</small>` : ''}
        </div>
      </div>
    </header>`;
  }
}

export default Header;
