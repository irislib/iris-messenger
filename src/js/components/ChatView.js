import { html, Component } from '../lib/htm.preact.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Message from './Message.js';
import {activeChat, chats, lastSeenTimeChanged, setLatestSeen, setLatestCheckmark} from '../Chat.js';
import Helpers from '../Helpers.js';
import Notifications from '../Notifications.js';
import Session from '../Session.js';

const notificationServiceUrl = 'https://iris-notifications.herokuapp.com/notify';

const submitButton = html`
  <button type="submit">
    <svg class="svg-inline--fa fa-w-16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
  </button>`;

const emojiPickerButton = html`
  <button type="button" id="emoji-picker">
    <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="smile" class="svg-inline--fa fa-smile fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"></path></svg>
  </button>`;

const subscribedToMsgs = {};

class ChatView extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    localState.get('activeChat').on(activeChatId => {
      this.setState({});
      if (activeChatId && !subscribedToMsgs[activeChatId]) {
        const iv = setInterval(() => {
          if (chats[activeChatId]) {
            clearInterval(iv);
            this.subscribeToMsgs(activeChatId);
            this.setState({});
          }
        }, 1000);
        subscribedToMsgs[activeChatId] = true;
      }
    });
  }

  async onMsgFormSubmit(event) {
    const pub = activeChat;
    event.preventDefault();
    chats[pub].msgDraft = null;
    var text = $('#new-msg').val();
    if (!text.length && !chats[pub].attachments) { return; }
    chats[pub].setTyping(false);
    var msg = {text};
    if (chats[pub].attachments) {
      msg.attachments = chats[pub].attachments;
    }
    const myKey = Session.getKey();
    const shouldWebPush = (pub === myKey.pub) || !(chats[pub].online && chats[pub].online.isOnline);
    if (shouldWebPush && chats[pub].webPushSubscriptions) {
      const subscriptions = [];
      const participants = Object.keys(chats[pub].webPushSubscriptions);
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const secret = await chats[pub].getSecret(participant);
        const myName = Session.getMyName();
        const titleText = chats[pub].uuid ? chats[pub].name : myName;
        const bodyText = chats[pub].uuid ? `${myName}: ${text}` : text;
        const payload = {
          title: await Gun.SEA.encrypt(titleText, secret),
          body: await Gun.SEA.encrypt(bodyText, secret),
          from:{pub: myKey.pub, epub: myKey.epub}
        };
        chats[pub].webPushSubscriptions[participant].forEach(s => subscriptions.push({subscription: s, payload}));
      }
      fetch(notificationServiceUrl, {
        method: 'POST',
        body: JSON.stringify({subscriptions}),
        headers: {
          'content-type': 'application/json'
        }
      });
    }
    chats[pub].send(msg);
    this.closeAttachmentsPreview();
    $('#new-msg').val('');
  }

  attachFileClicked(event) {
    console.log('hi');
    event.preventDefault();
    $('#attachment-input').click();
  }

  openAttachmentsPreview() {
    console.log('hohoo');
    $('#floating-day-separator').remove();
    var attachmentsPreview = $('#attachment-preview');
    attachmentsPreview.removeClass('gallery');
    attachmentsPreview.empty();
    var closeBtn = $('<button>').text(t('cancel')).click(this.closeAttachmentsPreview);
    attachmentsPreview.append(closeBtn);

    var files = $('#attachment-input')[0].files;
    if (files) {
      attachmentsPreview.show();
      $('#message-list').hide();
      for (var i = 0;i < files.length;i++) {
        Helpers.getBase64(files[i]).then(base64 => {
          chats[activeChat].attachments = chats[activeChat].attachments || [];
          chats[activeChat].attachments.push({type: 'image', data: base64});
          var preview = Helpers.setImgSrc($('<img>'), base64);
          attachmentsPreview.append(preview);
        });
      }
      $('#new-msg').focus();
    }
  }

  closeAttachmentsPreview() {
    $('#attachment-preview').hide();
    $('#attachment-preview').removeClass('gallery');
    $('#message-list').show();
    if (activeChat) {
      chats[activeChat].attachments = null;
    }
    Helpers.scrollToMessageListBottom();
  }

  subscribeToMsgs(pub) {
    subscribedToMsgs[pub] = true;
    chats[pub].getMessages((msg, info) => {
      if (chats[pub].messageIds[msg.time + info.from]) return;
      msg.info = info;
      msg.selfAuthored = info.selfAuthored;
      msg.timeStr = msg.time;
      msg.time = new Date(msg.time);
      chats[pub].messageIds[msg.time + info.from] = true;
      chats[pub].sortedMessages.push(msg);
      chats[pub].sortedMessages = chats[pub].sortedMessages.sort((a, b) => a.time - b.time);
      if (!info.selfAuthored && msg.time > (chats[pub].myLastSeenTime || -Infinity)) {
        if (activeChat !== pub || document.visibilityState !== 'visible') {
          Notifications.changeChatUnseenCount(pub, 1);
        }
      }
      if (!info.selfAuthored && msg.time > chats[pub].theirMsgsLastSeenDate) {
        chats[pub].theirMsgsLastSeenDate = msg.time;
        lastSeenTimeChanged(pub);
      }
      if (!chats[pub].latestTime || (msg.timeStr > chats[pub].latestTime)) {
        localState.get('chats').get(pub).put({
          latestTime: msg.timeStr,
          latest: {time: msg.timeStr, text: msg.text, selfAuthored: info.selfAuthored}
        });
        if (info.selfAuthored) {
          //latestEl.prepend($(seenIndicatorHtml));
          setLatestSeen(pub);
          setLatestCheckmark(pub);
        }
      }
      Notifications.notifyMsg(msg, info, pub);
      if (activeChat === pub) {
        this.setState({});
      }
    });
  }

  componentDidUpdate() {
    Helpers.scrollToMessageListBottom();
  }

  render() {
    if (!activeChat || !chats[activeChat].sortedMessages) {
      return html``;
    }

    const now = new Date();
    const nowStr = now.toLocaleDateString();
    let previousDateStr;
    let previousFrom;
    const msgListContent = [];
    if (chats[activeChat].sortedMessages) {
      Object.values(chats[activeChat].sortedMessages).forEach(msg => {
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
        msgListContent.push(html`<${Message} ...${msg} showName=${showName} key=${msg.time} chatId=${activeChat}/>`);
      });
    }

    return html`
      <div class="main-view ${activeChat === 'public' ? 'public-messages-view' : ''}" id="message-view">
        <div id="message-list">${msgListContent}</div>
        <div id="attachment-preview" class="hidden"></div>
      </div>
      <div id="not-seen-by-them" style="display: none">
        <p dangerouslySetInnerHTML=${{ __html: t('if_other_person_doesnt_see_message') }}></p>
        <p><button class="copy-chat-link">${t('copy_your_chat_link')}</button></p>
      </div>
      <div class="message-form">
        <form autocomplete="off" onSubmit=${e => this.onMsgFormSubmit(e)}>
          <input name="attachment-input" type="file" class="hidden" id="attachment-input" accept="image/*" multiple onChange=${() => this.openAttachmentsPreview()}/>
          <button type="button" id="attach-file" onClick=${this.attachFileClicked}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"/></svg>
          </button>
          ${emojiPickerButton}
          <input autofocus id="new-msg" type="text" placeholder="${t('type_a_message')}" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off"/>
          ${submitButton}
        </form>
      </div>`;
    }
}

export default ChatView;
