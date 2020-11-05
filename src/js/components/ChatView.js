import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Message from './Message.js';
import MessageForm from './MessageForm.js';
import {chats, newChat, subscribeToMessages} from '../Chat.js';
import Helpers from '../Helpers.js';
import Session from '../Session.js';
import Notifications from '../Notifications.js';
import ChatList from './ChatList.js';
import NewChat from './NewChat.js';

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
  var te = $(e.target);
  var originalText = te.text();
  var originalWidth = te.width();
  te.width(originalWidth);
  te.text(t('copied'));
  setTimeout(() => {
    te.text(originalText);
    te.css('width', '');
  }, 2000);
}

class ChatView extends Component {
  constructor() {
    super();
    this.eventListeners = [];
    this.sortedMessages = [];
    this.state = {sortedMessages: []};
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  addFloatingDaySeparator() {
    var currentDaySeparator = $('.day-separator').last();
    var pos = currentDaySeparator.position();
    while (currentDaySeparator && pos && pos.top - 55 > 0) {
      currentDaySeparator = currentDaySeparator.prevAll('.day-separator').first();
      pos = currentDaySeparator.position();
    }
    var s = currentDaySeparator.clone();
    var center = $('<div>').css({position: 'fixed', top: 70, 'text-align': 'center'}).attr('id', 'floating-day-separator').width($('#message-view').width()).append(s);
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

  componentDidMount() {
    this.update();
  }

  update() {
    $('.new-msg').focus();
    this.sortedMessages = [];
    this.setState({sortedMessages: this.sortedMessages});
    this.props.id && chats[this.props.id] && chats[this.props.id].setTyping(false);

    const update = () => {
      const chat = chats[this.props.id];
      if (!chat) return;
      Notifications.changeChatUnseenCount(this.props.id, 0);
      chat.setMyMsgsLastSeenTime();
      Helpers.scrollToMessageListBottom();
      chat.setMyMsgsLastSeenTime();
    }

    console.log(this.props.id, this.props.id.length > 20);
    if (this.props.id && this.props.id.length > 20) {
      const limitedUpdate = _.debounce((id) => {
        if (id !== this.props.id) return;
        this.sortedMessages.sort((a, b) => a.timeStr > b.timeStr ? 1 : -1);
        this.setState({sortedMessages: this.sortedMessages});
      }, 200);
      localState.get('privmsgs').get(this.props.id).map().once(s => {
        const msg = JSON.parse(s);
        this.sortedMessages.push(msg);
        limitedUpdate(this.props.id);
      });
      const iv = setInterval(() => {
        if (chats[this.props.id]) {
          clearInterval(iv);
          subscribeToMessages(this.props.id);
        } else {
          if (this.props.id.length > 40) { // exclude UUIDs
            newChat(this.props.id);
          }
        }
        update();
      }, 1000);
      update();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.update();
    }
    const chat = chats[this.props.id];
    Helpers.scrollToMessageListBottom();
    $('.msg-content img').off('load').on('load', () => Helpers.scrollToMessageListBottom());
    if (chat && !chat.uuid) {
      if ($('.msg.our').length && !$('.msg.their').length && !chat.theirMsgsLastSeenTime) {
        $('#not-seen-by-them').slideDown();
      } else {
        $('#not-seen-by-them').slideUp();
      }
    }
    localState.get('chats').get(this.props.id).get('msgDraft').once(m => $('.new-msg').val(m));
  }

  render() {
    const now = new Date();
    const nowStr = now.toLocaleDateString();
    let previousDateStr;
    let previousFrom;
    const msgListContent = [];
    console.log('render it', this.state.sortedMessages.length);
    if (chats[this.props.id] && this.state.sortedMessages) {
      this.state.sortedMessages.forEach(msg => {
        if (!(msg && msg.info)) return;
        const date = typeof msg.time === 'string' ? new Date(msg.timeStr) : msg.time;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            var separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
            msgListContent.push(html`<div class="day-separator">${t(separatorText)}</div>`);
          }
          previousDateStr = dateStr;
        }

        const from = msg.info && msg.info.from;
        let showName = false;
        if (previousFrom && (from !== previousFrom)) {
          msgListContent.push(html`<div class="from-separator"/>`);
          showName = true;
        }
        previousFrom = from;
        msgListContent.push(html`<${Message} ...${msg} showName=${showName} key=${msg.time} chatId=${this.props.id}/>`);
      });
    }

    return html`
      <div id="chat-view">
        <${ChatList} class=${this.props.id ? 'hidden-xs' : ''}/>
        <div id="chat-main" class=${this.props.id ? '' : 'hidden-xs'}>
  ${this.props.id && this.props.id.length > 20 ? html`<div class="main-view" id="message-view" onScroll=${e => this.onMessageViewScroll(e)}>
            <div id="message-list">${msgListContent}</div>
            <div id="attachment-preview" class="attachment-preview" style="display:none"></div>
          </div>` : html`<${NewChat}/>`}
          ${this.props.id ? html`
            <div id="scroll-down-btn" style="display:none;" onClick=${() => Helpers.scrollToMessageListBottom()}>${caretDownSvg}</div>
            <div id="not-seen-by-them" style="display: none">
            <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
            <p><button onClick=${e => copyMyChatLinkClicked(e)}>${t('copy_your_invite_link')}</button></p>
            </div>
            <div class="chat-message-form"><${MessageForm} activeChat=${this.props.id}/></div>
          `: ''}
        </div>
      </div>`;
    }
}

export default ChatView;
