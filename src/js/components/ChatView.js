import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Message from './Message.js';
import MessageForm from './MessageForm.js';
import {chats, processMessage, newChat} from '../Chat.js';
import Helpers from '../Helpers.js';
import Session from '../Session.js';
import Notifications from '../Notifications.js';
import ChatList from './ChatList.js';
import NewChat from './NewChat.js';
import {activeRoute} from '../Main.js';

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

const subscribedToMsgs = {};

class ChatView extends Component {
  constructor() {
    super();
    this.activeChat = null;
    this.eventListeners = [];
  }

  componentDidMount() {
    localState.get('activeRoute').on((activeRouteId, a, b, eve) => {
      this.eventListeners.push(eve);
      if (activeRouteId.indexOf('/chat/') !== 0 || !Session.getKey()) return;
      this.activeChat && chats[this.activeChat] && chats[this.activeChat].setTyping(false);
      this.activeChat = activeRouteId && activeRouteId.replace('/chat/', '');
      this.setState({});

      const update = () => {
        const chat = chats[this.activeChat];
        if (!chat) return;
        Notifications.changeChatUnseenCount(this.activeChat, 0);
        chat.setMyMsgsLastSeenTime();
        Helpers.scrollToMessageListBottom();
        chat.setMyMsgsLastSeenTime();
      }

      if (this.activeChat && (this.activeChat === 'public' || this.activeChat.length > 20) && !subscribedToMsgs[this.activeChat]) {
        const iv = setInterval(() => {
          if (chats[this.activeChat]) {
            clearInterval(iv);
            this.subscribeToMsgs(this.activeChat);
            chats[this.activeChat].sortedMessages.sort((a, b) => a.time - b.time);
            this.setState({});
          } else {
            if (this.activeChat.length > 40) { // exclude UUIDs
              newChat(this.activeChat);
            }
          }
          update();
        }, 1000);
        subscribedToMsgs[this.activeChat] = true;
        update();
      }
    });

    if (!iris.util.isMobile) {
      $("#new-msg").focus();
    }
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  subscribeToMsgs(pub) {
    subscribedToMsgs[pub] = true;
    const debouncedUpdate = _.debounce(() => {
      chats[pub].sortedMessages.sort((a, b) => a.time - b.time);
      this.setState({});
    }, 200);
    chats[pub].getMessages((msg, info) => {
      processMessage(pub, msg, info);
      if (activeRoute.replace('/chat/', '') === pub) {
        debouncedUpdate();
      }
    });
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

  componentDidUpdate() {
    const chat = chats[this.activeChat];
    Helpers.scrollToMessageListBottom();
    $('.msg-content img').off('load').on('load', () => Helpers.scrollToMessageListBottom());
    if (!iris.util.isMobile) {
      $("#new-msg").focus();
    }
    if (chat) {
      if (activeRoute === '/chat/public' || chat.theirMsgsLastSeenTime) {
        $('#not-seen-by-them:visible').slideUp();
      } else if (!chat.uuid && $('.msg.our').length) {
        $('#not-seen-by-them').slideDown();
      }
    }
    localState.get('chats').get(this.activeChat).get('msgDraft').once(m => $('#new-msg').val(m));
  }

  render() {
    const now = new Date();
    const nowStr = now.toLocaleDateString();
    let previousDateStr;
    let previousFrom;
    const msgListContent = [];
    if (chats[this.activeChat] && chats[this.activeChat].sortedMessages) {
      Object.values(chats[this.activeChat].sortedMessages).forEach(msg => {
        const date = typeof msg.time === 'string' ? new Date(msg.time) : msg.time;
        if (date) {
          const dateStr = date.toLocaleDateString();
          if (dateStr !== previousDateStr) {
            var separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
            msgListContent.push(html`<div class="day-separator">${t(separatorText)}</div>`);
          }
          previousDateStr = dateStr;
        }

        const from = msg.info.from;
        let showName = false;
        if (previousFrom && (from !== previousFrom)) {
          msgListContent.push(html`<div class="from-separator"/>`);
          showName = true;
        }
        previousFrom = from;
        msgListContent.push(html`<${Message} ...${msg} showName=${showName} key=${msg.time} chatId=${this.activeChat}/>`);
      });
    }

    return html`
      <div id="chat-view">
        <${ChatList}/>
        <div style="display:flex;flex-direction:column;flex:3;">
					${this.props.id ? html`<div class="main-view" id="message-view" onScroll=${e => this.onMessageViewScroll(e)}>
            <div id="message-list">${msgListContent}</div>
            <div id="attachment-preview" style="display:none"></div>
          </div>` : html`<${NewChat}/>`}
          <div id="not-seen-by-them" style="display: none">
            <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
            <p><button onClick=${e => copyMyChatLinkClicked(e)}>${t('copy_your_chat_link')}</button></p>
          </div>
          <div id="scroll-down-btn" style="display:none;" onClick=${() => Helpers.scrollToMessageListBottom()}>${caretDownSvg}</div>
          <div class="message-form"><${MessageForm} activeChat=${this.activeChat}/></div>
        </div>
      </div>`;
    }
}

export default ChatView;
