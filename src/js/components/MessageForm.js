import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import { translate as t } from '../Translation.js';
import {chats} from '../Chat.js';
import {localState} from '../Main.js';
import Helpers from '../Helpers.js';
import {activeRoute} from '../Main.js';
import Session from '../Session.js';

const notificationServiceUrl = 'https://iris-notifications.herokuapp.com/notify';

const submitButton = html`
  <button type="submit">
    <svg class="svg-inline--fa fa-w-16" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" width="100px" height="100px" fill="currentColor" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
  </button>`;

class MessageForm extends Component {
  componentDidMount() {
    this.picker = new EmojiButton({position: 'top-start'});
    this.picker.on('emoji', emoji => {
      $('#new-msg').val($('#new-msg').val() + emoji);
      $('#new-msg').focus();
    });
  }

  async onMsgFormSubmit(event) {
    const chat = chats[this.props.activeChat];
    event.preventDefault();
    localState.get('chats').get(this.props.activeChat).get('msgDraft').put(null);
    const text = $('#new-msg').val();
    if (!text.length && !chat.attachments) { return; }
    chat.setTyping(false);
    const msg = {text};
    if (chat.attachments) {
      msg.attachments = chat.attachments;
    }
    chat.send(msg);
    this.closeAttachmentsPreview();
    $('#new-msg').val('');
    const textarea = $('textarea#new-msg');
    textarea && textarea.height("");
    this.webPush(msg);
  }

  onEmojiButtonClick(event) {
    event.preventDefault();
    this.picker.pickerVisible ? this.picker.hidePicker() : this.picker.showPicker(event.target);
  }

  setTextareaHeight(textarea) {
    textarea.style.height = "";
    textarea.style.height = event.target.scrollHeight + "px";
  }

  onMsgTextInput(event) {
    if (event.target.type === 'textarea') {
      this.setTextareaHeight(event.target);
    }
    this.isTyping = this.isTyping !== undefined ? this.isTyping : false;
    const getIsTyping = () => $('#new-msg').val().length > 0;
    const setTyping = () => chats[this.props.activeChat].setTyping(getIsTyping());
    const setTypingThrottled = _.throttle(setTyping, 1000);
    if (this.isTyping === getIsTyping()) {
      setTypingThrottled();
    } else {
      setTyping();
    }
    this.isTyping = getIsTyping();
    localState.get('chats').get(this.props.activeChat).get('msgDraft').put($(event.target).val());
  }

  attachFileClicked(event) {
    event.preventDefault();
    $('#attachment-input').click();
  }

  openAttachmentsPreview() {
    $('#floating-day-separator').remove();
    var attachmentsPreview = $('#attachment-preview');
    attachmentsPreview.removeClass('gallery');
    attachmentsPreview.empty();
    var closeBtn = $('<button>').text(t('cancel')).click(() => this.closeAttachmentsPreview());
    attachmentsPreview.append(closeBtn);

    var files = $('#attachment-input')[0].files;
    if (files) {
      attachmentsPreview.show();
      $('#message-list').hide();
      for (var i = 0;i < files.length;i++) {
        Helpers.getBase64(files[i]).then(base64 => {
          chats[this.props.activeChat].attachments = chats[this.props.activeChat].attachments || [];
          chats[this.props.activeChat].attachments.push({type: 'image', data: base64});
          var preview = Helpers.setImgSrc($('<img>'), base64);
          attachmentsPreview.append(preview);
        });
      }
      $('#attachment-input').val(null)
      $('#new-msg').focus();
    }

    $(document).off('keyup').on('keyup', e => {
      if (e.key === "Escape") { // escape key maps to keycode `27`
        $(document).off('keyup');
        if ($('#attachment-preview:visible').length) {
          this.closeAttachmentsPreview();
        }
      }
    });
  }

  closeAttachmentsPreview() {
    $('#attachment-preview').hide();
    $('#attachment-preview').removeClass('gallery');
    $('#message-list').show();
    if (chats[this.props.activeChat]) {
      chats[this.props.activeChat].attachments = null;
    }
    if (this.props.activeChat !== 'public') {
      Helpers.scrollToMessageListBottom();      
    }
  }

  async webPush(msg) {
    const chat = chats[this.props.activeChat];
    const myKey = Session.getKey();
    const shouldWebPush = (activeRoute === '/chat/' + myKey.pub) || !(chat.activity);
    if (shouldWebPush && chat.webPushSubscriptions) {
      const subscriptions = [];
      const participants = Object.keys(chat.webPushSubscriptions);
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const secret = await chat.getSecret(participant);
        const myName = Session.getMyName();
        const titleText = chat.uuid ? chat.name : myName;
        const bodyText = chat.uuid ? `${myName}: ${msg.text}` : msg.text;
        const payload = {
          title: await Gun.SEA.encrypt(titleText, secret),
          body: await Gun.SEA.encrypt(bodyText, secret),
          from:{pub: myKey.pub, epub: myKey.epub}
        };
        chat.webPushSubscriptions[participant].forEach(s => subscriptions.push({subscription: s, payload}));
      }
      fetch(notificationServiceUrl, {
        method: 'POST',
        body: JSON.stringify({subscriptions}),
        headers: {
          'content-type': 'application/json'
        }
      }).catch(() => {});
    }
  }

  render() {
    return html`<form autocomplete="off" onSubmit=${e => this.onMsgFormSubmit(e)}>
      <input name="attachment-input" type="file" class="hidden" id="attachment-input" accept="image/*" multiple onChange=${() => this.openAttachmentsPreview()}/>
      <button type="button" id="attach-file" onClick=${this.attachFileClicked}>
        <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"/></svg>
      </button>
      <button class="${iris.util.isMobile ? 'hidden' : ''}" type="button" id="emoji-picker" onClick=${e => this.onEmojiButtonClick(e)}>
        <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="smile" class="svg-inline--fa fa-smile fa-w-16" role="img" viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"></path></svg>
      </button>
      <${this.props.activeChat === 'public' ? 'textarea' : 'input'} onInput=${e => this.onMsgTextInput(e)} id="new-msg" type="text" placeholder="${t('type_a_message')}" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off"/>
      ${submitButton}
    </form>`;
  }

}

export default MessageForm;
