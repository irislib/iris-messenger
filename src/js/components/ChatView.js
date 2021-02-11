import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import State from '../State.js';
import Identicon from './Identicon.js';
import Message from './Message.js';
import MessageForm from './MessageForm.js';
import Helpers from '../Helpers.js';
import Session from '../Session.js';
import Notifications from '../Notifications.js';
import ChatList from './ChatList.js';
import NewChat from './NewChat.js';
import ScrollWindow from '../lib/ScrollWindow.js';

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
const scrollerSize = 26;

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

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

class ChatView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
  }

  componentDidMount() {
    if (!(this.props.id && this.props.id.length > 20)) return;
    this.unsubscribe();
    this.sortedMessages = [];
    this.participants = {};
    this.setState({sortedMessages: this.sortedMessages, participants: this.participants});
    this.iv = null;
    this.chat = null;
    const go = () => {
      this.chat = Session.channels[this.props.id];
      if (this.chat) {
        clearInterval(this.iv)
        Session.subscribeToMsgs(this.props.id);
        Notifications.changeChatUnseenCount(this.props.id, 0);
        this.chat.setMyMsgsLastSeenTime();
        Helpers.scrollToMessageListBottom();
        this.chat.setMyMsgsLastSeenTime();
        if (this.chat.uuid) {
          this.chat.inviteLinks = {};
          this.chat.getChatLinks({callback: ({url, id}) => {
            this.chat.inviteLinks[id] = url; // TODO state
          }});
        }
      }
    }
    this.iv = setInterval(go, 3000);

    State.local.get('channels').get(this.props.id).get('participants').map().on((v, k, b, e) => {
      console.log(3, k);
      this.eventListeners['participants'] = e;
      this.participants[k] = true;
      this.setState({participants: this.participants});
    });
    State.local.get('channels').get(this.props.id).get('msgDraft').once(m => $('.new-msg').val(m));
    const node = State.local.get('channels').get(this.props.id).get('msgs');
    const limitedUpdate = _.throttle(sortedMessages => this.setState({sortedMessages}), 100); // TODO: this is jumpy, as if reverse sorting is broken? why isn't MessageFeed the same?
    this.scrollState = {previousDownIndex: -1, previousUpIndex: -1};
    const container = document.getElementById("message-list");
    container.style.paddingBottom = 0;
    container.style.paddingTop = 0;
    this.scroller = new ScrollWindow(node, {open: true, size: scrollerSize, onChange: limitedUpdate});
    this.initIntersectionObserver();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      $('#not-seen-by-them').hide();
      this.componentDidMount();
    } else {
      if (this.scroller && this.scroller.opts.stickTo === 'top') { Helpers.scrollToMessageListBottom(); }
      $('.msg-content img').off('load').on('load', () => Helpers.scrollToMessageListBottom());
      if (this.chat && !this.chat.uuid) {
        if ($('.msg.our').length && !$('.msg.their').length && !this.chat.theirMsgsLastSeenTime) {
          $('#not-seen-by-them').slideDown();
        } else {
          $('#not-seen-by-them').slideUp();
        }
      }
    }
  }

  unsubscribe() {
    clearInterval(this.iv);
    this.scroller && this.scroller.unsubscribe();
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentWillUnmount() {
    this.unsubscribe();
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

  scrollDown() {
    Helpers.scrollToMessageListBottom();
    this.scroller.top();
    document.getElementById("message-list").style.paddingBottom = 0;
  }

  render() {
    const now = new Date();
    const nowStr = now.toLocaleDateString();
    let previousDateStr;
    let previousFrom;
    const msgListContent = [];
    this.state.sortedMessages && Object.values(this.state.sortedMessages).forEach((msg, i) => {
      if (typeof msg !== 'object') { return; }
      const date = typeof msg.time === 'string' ? new Date(msg.time) : msg.time;
      let isDifferentDay;
      if (date) {
        const dateStr = date.toLocaleDateString();
        if (dateStr !== previousDateStr) {
          isDifferentDay = true;
          var separatorText = iris.util.getDaySeparatorText(date, dateStr, now, nowStr);
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

    return html`
    <div id="chat-view">
    <${ChatList} class=${this.props.id ? 'hidden-xs' : ''}/>
    <div id="chat-main" class=${this.props.id ? '' : 'hidden-xs'}>
    ${this.props.id && this.props.id.length > 20 ? html`
      <div class="main-view" id="message-view" onScroll=${e => this.onMessageViewScroll(e)}>
        <div id="message-list">
          <div id="topsentinel"></div>
          ${msgListContent}
          <div id="bottomsentinel"></div>
        </div>
        <div id="attachment-preview" class="attachment-preview" style="display:none"></div>
      </div>` : html`<${NewChat}/>`
    }
    ${this.props.id ? html`
      <div id="scroll-down-btn" style="display:none;" onClick=${() => this.scrollDown()}>${caretDownSvg}</div>
      <div id="not-seen-by-them" style="display: none">
      <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
      <p><button onClick=${e => copyMyChatLinkClicked(e)}>${t('copy_your_invite_link')}</button></p>
      </div>
      <div class="chat-message-form"><${MessageForm} activeChat=${this.props.id} onSubmit=${() => this.scrollDown()}/></div>
      `: ''}
      </div>
      ${this.props.id && this.props.id.length < 40 ? html`
        <div class="participant-list">
          ${this.state.participants ? Object.keys(this.state.participants).map(k =>
            html`
              <div class="text">
                <${Identicon} str=${k} width=30/>
                <iris-text user=${k} path="profile/name" placeholder=" "/>
              </div>
            `
          ) : ''}
        </div>
      `: ''}
      </div>`;
  }

  adjustPaddings(isScrollDown) {
    const container = document.getElementById("message-list");
    const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
    const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
    const remPaddingsVal = 62 * (scrollerSize / 2); // TODO: calculate actual element heights
    if (isScrollDown) {
      container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
      container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    } else {
      container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
      if (currentPaddingTop === 0) {
        $('#message-view').scrollTop($('#topsentinel').offset().top + remPaddingsVal);
      } else {
        container.style.paddingTop = currentPaddingTop - remPaddingsVal + "px";
      }
    }
  }

  topSentCallback(entry) {
    const container = document.getElementById("message-list");

    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling up
    if (
      currentY > this.scrollState.topSentinelPreviousY &&
      isIntersecting &&
      currentRatio >= this.scrollState.topSentinelPreviousRatio &&
      this.scroller.center !== this.scrollState.previousUpIndex && // stop if no new results were received
      this.scroller.opts.stickTo !== 'bottom'
    ) {
      this.scrollState.previousUpIndex = this.scroller.center;
      this.adjustPaddings(false);
      this.scroller.down(scrollerSize / 2);
    }
    this.scrollState.topSentinelPreviousY = currentY;
    this.scrollState.topSentinelPreviousRatio = currentRatio;
  }

  botSentCallback(entry) {
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling down
    if (
      currentY < this.scrollState.bottomSentinelPreviousY &&
      currentRatio > this.scrollState.bottomSentinelPreviousRatio &&
      isIntersecting &&
      this.scroller.center !== this.scrollState.previousDownIndex &&  // stop if no new results were received
      this.scroller.opts.stickTo !== 'top'
    ) {
      this.scrollState.previousDownIndex = this.scroller.center;
      this.adjustPaddings(true);
      this.scroller.up(scrollerSize / 2);
    }
    this.scrollState.bottomSentinelPreviousY = currentY;
    this.scrollState.bottomSentinelPreviousRatio = currentRatio;
  }

  initIntersectionObserver() {
    const options = {
      //root: document.getElementById('message-view'),
      //rootMargin: '500px',
    }

    const callback = entries => {
      entries.forEach(entry => {
        if (entry.target.id === 'topsentinel') {
          this.topSentCallback(entry);
        } else if (entry.target.id === `bottomsentinel`) {
          this.botSentCallback(entry);
        }
      });
    }

    var observer = new IntersectionObserver(callback, options); // TODO: It's possible to quickly scroll past the sentinels without them firing. Top and bottom sentinels should extend to page top & bottom?
    observer.observe(document.querySelector("#topsentinel"));
    observer.observe(document.querySelector(`#bottomsentinel`));
  }
}

export default ChatView;
