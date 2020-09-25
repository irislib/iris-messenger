import { Component } from '../lib/preact.js';import { html } from '../Helpers.js';
import {chats, getDisplayName} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState, showMenu, activeRoute, publicState} from '../Main.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import { route } from '../lib/preact-router.es.js';
import Identicon from './Identicon.js';

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
    showMenu(true);
  }

  onClick() {
    if (this.chatId) {
      route('/profile/' + this.chatId);
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
    $(this.base).css({cursor: this.chatId ? 'pointer' : ''});
  }

  componentDidMount() {
    localState.get('activeRoute').on(activeRoute => {
      this.eventListeners.forEach(e => e.off());
      this.eventListeners = [];
      this.setState({});
      const replaced = activeRoute.replace('/chat/', '').replace('/profile/', '');
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
      if (!activeRoute || activeRoute === '/') {
        title = t('new_chat');
      } else if (activeRoute === '/chat/public') {
        title = t('public_messages');
      } else if (activeRoute === '/settings') {
        title = t('settings');
      } else if (activeRoute === '/logout') {
        title = t('log_out') + '?';
      } else if (activeRoute.indexOf('/chat/') === 0 || activeRoute.indexOf('/profile/') === 0) {
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
      } else if (activeRoute.indexOf('/message/') === 0) {
        localState.get('msgFrom').on((from, a, b, eve) => {
          this.eventListeners.push(eve);
          if (!from) return;
          this.chatId = from;
          console.log('from', from);
          publicState.user(from).get('profile').get('name').on((name, a, b, eve) => {
            this.eventListeners.push(eve);
            this.setState({title: name});
          });
        })
      }
      this.setState({title});
    });
  }

  render() {
    const chat = chats[this.chatId];
    const isTyping = chat && chat.isTyping;
    const participants = chat && chat.uuid && Object.keys(chat.participantProfiles).map(p => chat.participantProfiles[p].name).join(', ');
    const onlineStatus = !(chat && chat.uuid) && activeRoute && activeRoute.length > 20 && !isTyping && this.getOnlineStatusText();
    const key = Session.getKey().pub;

    return html`
    <header>
      <div id="back-button" class="visible-xs-inline-block" onClick=${() => this.backButtonClicked()}>
        ‹
        <span class="unseen unseen-total"></span>
      </div>
      <div id="header-content" onClick="${e => this.onClick(e)}">
        <a href="/"><img src="img/icon128.png" width="40" height="40"/></a>
        <div class="text">
          <!--<div class="name">
            ${this.state.title}
          </div>-->
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${participants ? html`<small class="participants">${participants}</small>` : ''}
          ${onlineStatus ? html`<small class="last-seen">${onlineStatus}</small>` : ''}
        </div>
        <a href="/chat">
          <svg class="svg-inline--fa fa-w-16" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;width: 1em;" width="100px" height="100px" fill="currentColor" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
        </a>
        <${Identicon} str=${key} width=40 onClick=${() => route('/profile/' + key)} />
      </div>
    </header>`;
  }
}

export default Header;
