import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { html } from 'htm/preact';
import $ from 'jquery';

import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

class ChatMessageForm extends Component {
  componentDidMount() {
    if (!Helpers.isMobile && this.props.autofocus !== false) {
      $(this.base).find('.new-msg').focus();
    }
  }

  componentDidUpdate() {
    if (!Helpers.isMobile && this.props.autofocus !== false) {
      $(this.base).find('.new-msg').focus();
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

  async onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
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

  onMsgTextInput(event) {
    localState
      .get('channels')
      .get(this.props.activeChat)
      .get('msgDraft')
      .put($(event.target).val());
  }

  onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      this.onSubmit(e);
    }
  }

  render() {
    return html`<form
      autocomplete="off"
      class="message-form ${this.props.class || ''}"
      onSubmit=${(e) => this.onSubmit(e)}
    >
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
        <${PaperAirplaneIcon} onClick=${(e) => this.onSubmit(e)} width="28" />
      </button>
    </form>`;
  }
}

export default ChatMessageForm;
