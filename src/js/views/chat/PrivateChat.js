import Helpers from '../../Helpers';
import { html } from 'htm/preact';
import {createRef} from 'preact';
import { translate as t } from '../../Translation';
import State from '../../State';
import Identicon from '../../components/Identicon';
import Message from '../../components/Message';
import ChatMessageForm from './ChatMessageForm';
import Name from '../../components/Name';
import Session from '../../Session';
import Notifications from '../../Notifications';
import NewChat from './NewChat';
import _ from 'lodash';
import $ from 'jquery';
import iris from '../../iris-lib';
import {Helmet} from 'react-helmet';
import Component from '../../BaseComponent';

const caretDownSvg = html`
<svg x="0px" y="0px"
width="451.847px" height="451.847px" viewBox="0 0 451.847 451.847" style="enable-background:new 0 0 451.847 451.847;">
<g>
<path fill="currentColor" d="M225.923,354.706c-8.098,0-16.195-3.092-22.369-9.263L9.27,151.157c-12.359-12.359-12.359-32.397,0-44.751
c12.354-12.354,32.388-12.354,44.748,0l171.905,171.915l171.906-171.909c12.359-12.354,32.391-12.354,44.744,0
c12.365,12.354,12.365,32.392,0,44.751L248.292,345.449C242.115,351.621,234.018,354.706,225.923,354.706z"/>
</g>
</svg>
`;

function copyMyChatLinkClicked(e) {
  Helpers.copyToClipboard(Session.getMyChatLink());
  let te = $(e.target);
  let originalText = te.text();
  let originalWidth = te.width();
  te.width(originalWidth);
  te.text(t('copied'));
  setTimeout(() => {
    te.text(originalText);
    te.css('width', '');
  }, 2000);
}

export default class PrivateChat extends Component {
  constructor() {
    super();
    this.hashtagChatRef = createRef();
    this.state = {
      sortedMessages: [],
      sortedParticipants: [],
      showParticipants: true,
      stickToBottom: true,
      noLongerParticipant: false
    };
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    if (!(this.props.id && this.props.id.length > 20)) return;
    this.participants = {};
    this.iv = null;
    this.chat = null;
    const go = () => {
      this.chat = Session.channels[this.props.id];
      if (!this.chat && this.props.id.length > 40) {
        this.chat = Session.newChannel(this.props.id);
      }
      if (this.chat) {
        clearInterval(this.iv)
        Session.subscribeToMsgs(this.props.id);
        Notifications.changeChatUnseenCount(this.props.id, 0);
        this.chat.setMyMsgsLastSeenTime();
        Helpers.scrollToMessageListBottom();
        this.chat.setMyMsgsLastSeenTime();
      }
    }
    this.iv = setInterval(go, 3000);
    go();

    State.local.get('showParticipants').put(true);
    State.local.get('showParticipants').on(this.inject());
    State.local.get('channels').get(this.props.id).get('participants').map().on(this.sub(
      (v, k) => {
        const hasAlready = !!this.participants[k];
        this.participants[k] = v;
        if (!!v && !hasAlready) {
          State.public.user(k).get('activity').on(this.sub(
            (activity) => {
              if (this.participants[k]) { this.participants[k].activity = activity; }
              this.setSortedParticipants();
            }
          ));
        }
        this.setSortedParticipants();
      }
    ));
    State.local.get('channels').get(this.props.id).get('msgDraft').once(m => $('.new-msg').val(m));
    const node = State.local.get('channels').get(this.props.id).get('msgs');
    const limitedUpdate = _.throttle(() => this.setState({
      sortedMessages: Object.keys(this.msgs).sort().map(k => this.msgs[k])
    }), 100); // TODO: this is jumpy, as if reverse sorting is broken? why isn't MessageFeed the same?
    this.msgs = {};
    node.map(this.sub(
      (msg, time) => {
        this.msgs[time] = msg;
        limitedUpdate();
      }
    ));
    const container = document.getElementById("message-list");
    container.style.paddingBottom = 0;
    container.style.paddingTop = 0;
    const el = $("#message-view");
    el.off('scroll').on('scroll', () => {
      const scrolledToBottom = (el[0].scrollHeight - el.scrollTop() == el.outerHeight());
      if (this.state.stickToBottom && !scrolledToBottom) {
        this.setState({stickToBottom: false});
      } else if (!this.state.stickToBottom && scrolledToBottom) {
        this.setState({stickToBottom: true});
      }
    });
  }

  setSortedParticipants() {
    let noLongerParticipant = true;
    const sortedParticipants = Object.keys(this.participants)
    .filter(k => {
      const p = this.participants[k];
      const hasPermissions = p && p.read && p.write;
      if (noLongerParticipant && hasPermissions && k === Session.getPubKey()) {
        noLongerParticipant = false;
      }
      return hasPermissions;
    })
    .sort((a, b) => {
      const aO = this.participants[a];
      const bO = this.participants[b];
      const aActive = new Date(aO && aO.activity && aO.activity.time || 0);
      const bActive = new Date(bO && bO.activity && bO.activity.time || 0);
      if (Math.abs(aActive - bActive) < 10000) {
        return a > b ? -1 : 1;
      }
      if (aActive > bActive) { return -1; }
      else if (aActive < bActive) { return 1; }
       return 0;
    });
    this.setState({sortedParticipants, noLongerParticipant});
  }

  componentDidUpdate() {
    if (this.state.stickToBottom) {
      Helpers.scrollToMessageListBottom();
    }

    $('.msg-content img').off('load').on('load', () => this.state.stickToBottom && Helpers.scrollToMessageListBottom());
      setTimeout(() => {
        console.log(this.props.id, Session.getPubKey());
        if (this.chat && !this.chat.uuid && this.props.id !== Session.getPubKey()) {
          if ($('.msg.our').length && !$('.msg.their').length && !this.chat.theirMsgsLastSeenTime) {
            $('#not-seen-by-them').slideDown();
          } else {
            $('#not-seen-by-them').slideUp();
          }
        }
      }, 2000);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    clearInterval(this.iv);
  }

  addFloatingDaySeparator() {
    let currentDaySeparator = $('.day-separator').last();
    let pos = currentDaySeparator.position();
    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator.prevAll('.day-separator').first();
      pos = currentDaySeparator.position();
    }
    let s = currentDaySeparator.clone();
    let center = $('<div>').css({position: 'fixed', top: 70, 'text-align': 'center'}).attr('id', 'floating-day-separator').width($('#message-view').width()).append(s);
    $('#floating-day-separator').remove();
    setTimeout(() => s.fadeOut(), 2000);
    $('#message-view').prepend(center);
  }

  toggleScrollDownBtn() {
    const el = $('#message-view');
    const scrolledToBottom = el[0].scrollHeight - el.scrollTop() <= el.outerHeight() + 200;
    if (scrolledToBottom) {
      $('#scroll-down-btn:visible').fadeOut(150);
    } else {
      $('#scroll-down-btn:not(:visible)').fadeIn(150);
    }
  }

  onMessageViewScroll() {
    this.messageViewScrollHandler = this.messageViewScrollHandler || _.throttle(() => {
      if ($('#attachment-preview:visible').length) { return; }
      this.addFloatingDaySeparator();
      this.toggleScrollDownBtn();
    }, 200);
    this.messageViewScrollHandler();
  }

  scrollDown() {
    Helpers.scrollToMessageListBottom();
    const el = document.getElementById("message-list");
    el && (el.style.paddingBottom = 0);
  }

  renderMainView() {
    let mainView;
    if (this.props.id && this.props.id.length > 20) {
      const now = new Date();
      const nowStr = now.toLocaleDateString();
      let previousDateStr;
      let previousFrom;
      const msgListContent = [];
      this.state.sortedMessages && Object.values(this.state.sortedMessages).forEach(msg => {
        if (typeof msg !== 'object') {
          try {
            msg = JSON.parse(msg);
          } catch (e) {
            console.error('JSON.parse(msg) failed', e);
            return;
          }
        }
        const date = typeof msg.time === 'string' ? new Date(msg.time) : msg.time;
        let isDifferentDay;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            isDifferentDay = true;
            let separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
            msgListContent.push(html`<div class="day-separator">${t(separatorText)}</div>`);
          }
          previousDateStr = dateStr;
        }

        let showName = false;
        if (isDifferentDay || (previousFrom && (msg.from !== previousFrom))) {
          msgListContent.push(html`<div class="from-separator"/>`);
          showName = true;
        }
        previousFrom = msg.from;
        msgListContent.push(html`
          <${Message} ...${msg} showName=${showName} key=${msg.time} chatId=${this.props.id}/>
        `);
      });

      mainView = html`
        <div class="main-view" id="message-view" onScroll=${e => this.onMessageViewScroll(e)}>
          <div id="message-list">
            ${msgListContent}
          </div>
          <div id="attachment-preview" class="attachment-preview" style="display:none"></div>
        </div>`;
    } else {
      mainView = html`<${NewChat}/>`;
    }
    return mainView;
  }

  renderParticipantList() {
    const participants = this.state.sortedParticipants;
    return this.props.id && this.props.id !== 'new' && this.props.id.length < 40 ? html`
      <div class="participant-list ${this.state.showParticipants ? 'open' : ''}">
        ${participants.length ? html`
          <small>${participants.length} ${t('participants')}</small>
        ` : ''}
        ${participants.map(k =>
          html`
            <a href="/profile/${k}">
              <span class="text">
                <${Identicon} key="i${k}" str=${k} width=30 activity=${true}/>
                <${Name} pub=${k} key="t${k}" />
              </span>
            </a>
          `
        )}
      </div>
    `: '';
  }

  renderMsgForm() {
    return this.props.id && this.props.id.length > 20 ? html`
      <div id="scroll-down-btn" style="display:none;" onClick=${() => this.scrollDown()}>${caretDownSvg}</div>
      <div id="not-seen-by-them" style="display: none">
        <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
        <p><button onClick=${e => copyMyChatLinkClicked(e)}>${t('copy_your_invite_link')}</button></p>
      </div>
      <div class="chat-message-form">
        ${this.state.noLongerParticipant ? html`<div style="text-align:center">You can't send messages to this group because you're no longer a participant.</div>` :
          html`<${ChatMessageForm} key=${this.props.id} activeChat=${this.props.id} onSubmit=${() => this.scrollDown()}/>`}
      </div>
      `: '';
  }

  render() {
    return html`
      <${Helmet}><title>${this.chat && this.chat.name || 'Messages'}</title><//>
      <div id="chat-main" class="${this.props.id ? '' : 'hidden-xs'}">
        ${this.renderMainView()}
        ${this.renderMsgForm()}
      </div>
      ${this.renderParticipantList()}
    `;
  }
}
