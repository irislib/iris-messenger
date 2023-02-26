import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';

import MessageForm from '../../components/MessageForm';
import Torrent from '../../components/Torrent';
import Helpers from '../../Helpers';
import EmojiButton from '../../lib/emoji-button';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Nostr from '../../nostr/Nostr';
import { translate as t } from '../../translations/Translation';
import localState from "../../LocalState";

const submitButton = html` <button type="submit">
  <svg
    class="svg-inline--fa fa-w-16"
    x="0px"
    y="0px"
    viewBox="0 0 486.736 486.736"
    style="enable-background:new 0 0 486.736 486.736;"
    width="100px"
    height="100px"
    fill="currentColor"
    stroke="#000000"
    stroke-width="0"
  >
    <path
      fill="currentColor"
      d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"
    ></path>
  </svg>
</button>`;

class ChatMessageForm extends MessageForm {
  componentDidMount() {
    this.picker = new EmojiButton({ position: 'top-start' });
    this.picker.on('emoji', (emoji) => {
      const textEl = $(this.base).find('.new-msg');
      textEl.val(textEl.val() + emoji);
      textEl.focus();
    });
    if (!Helpers.isMobile && this.props.autofocus !== false) {
      $(this.base).find('.new-msg').focus();
    }
  }

  componentDidUpdate() {
    if (!Helpers.isMobile && this.props.autofocus !== false) {
      $(this.base).find('.new-msg').focus();
    }
    if ($('#attachment-preview:visible').length) {
      $('#attachment-preview').append($('#webtorrent'));
    }
  }

  encrypt(text) {
    try {
      const theirPub = Nostr.toNostrHexAddress(this.props.activeChat);
      if (!theirPub) {
        throw new Error('invalid public key ' + theirPub);
      }
      return Key.encrypt(text, theirPub);
    } catch (e) {
      console.error(e);
    }
  }

  onMsgFormSubmit(event) {
    event.preventDefault();
    this.submit();
  }

  async submit() {
    const textEl = $(this.base).find('.new-msg');
    const text = textEl.val();
    if (!text.length) {
      return;
    }
    const content = await this.encrypt(text);
    const recipient = Nostr.toNostrHexAddress(this.props.activeChat);
    if (!recipient) {
      throw new Error('invalid public key ' + recipient);
    }
    Events.publish({
      kind: 4,
      content,
      tags: [['p', recipient]],
    });
    textEl.val('');

    Helpers.scrollToMessageListBottom();
  }

  onEmojiButtonClick(event) {
    event.preventDefault();
    this.picker.pickerVisible ? this.picker.hidePicker() : this.picker.showPicker(event.target);
  }

  onMsgTextInput(event) {
    localState
      .get('channels')
      .get(this.props.activeChat)
      .get('msgDraft')
      .put($(event.target).val());
  }

  onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      this.submit();
    }
  }

  render() {
    const contentBtns = html` <button
      class="emoji-picker-btn hidden-xs"
      type="button"
      onClick=${(e) => this.onEmojiButtonClick(e)}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        data-prefix="far"
        data-icon="smile"
        class="svg-inline--fa fa-smile fa-w-16"
        role="img"
        viewBox="0 0 496 512"
      >
        <path
          fill="currentColor"
          d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"
        ></path>
      </svg>
    </button>`;

    return html`<form
      autocomplete="off"
      class="message-form ${this.props.class || ''}"
      onSubmit=${(e) => this.onMsgFormSubmit(e)}
    >
      ${contentBtns}
      <input
        name="attachment-input"
        type="file"
        class="hidden attachment-input"
        accept="image/*"
        multiple
        onChange=${() => this.openAttachmentsPreview()}
      />
      <input
        onInput=${(e) => this.onMsgTextInput(e)}
        onKeyDown=${(e) => this.onKeyDown(e)}
        class="new-msg"
        type="text"
        placeholder="${t('type_a_message')}"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="sentences"
        spellcheck="off"
      />
      ${submitButton}
      <div id="webtorrent">
        ${this.state.torrentId
          ? html`<${Torrent} preview=${true} torrentId=${this.state.torrentId} />`
          : ''}
      </div>
    </form>`;
  }
}

export default ChatMessageForm;
