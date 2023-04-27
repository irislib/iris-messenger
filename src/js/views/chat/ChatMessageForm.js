import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { html } from 'htm/preact';
import $ from 'jquery';

import MessageForm from '../../components/MessageForm';
import Torrent from '../../components/Torrent';
import Helpers from '../../Helpers';
import EmojiButton from '../../lib/emoji-button';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';

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
      const theirPub = Key.toNostrHexAddress(this.props.activeChat);
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
    const recipient = Key.toNostrHexAddress(this.props.activeChat);
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
      <${FaceSmileIcon} width="28" />
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
      <button style="margin-right:0">
        <${PaperAirplaneIcon} onClick=${() => this.submit()} width="28" />
      </button>
      <div id="webtorrent">
        ${this.state.torrentId
          ? html`<${Torrent} preview=${true} torrentId=${this.state.torrentId} />`
          : ''}
      </div>
    </form>`;
  }
}

export default ChatMessageForm;
