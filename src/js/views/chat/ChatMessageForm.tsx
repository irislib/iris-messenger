import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import $ from 'jquery';

import BaseComponent from '../../BaseComponent';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';

interface ChatMessageFormProps {
  activeChat: string;
  class?: string;
  autofocus?: boolean;
  onSubmit?: () => void;
}

class ChatMessageForm extends BaseComponent<ChatMessageFormProps> {
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

  encrypt(text: string) {
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

  async onSubmit(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const textEl = $(this.base).find('.new-msg');
    const text = textEl.val() as string;
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

    this.props.onSubmit?.();
  }

  onMsgTextInput(event: Event) {
    localState
      .get('channels')
      .get(this.props.activeChat)
      .get('msgDraft')
      .put($(event.target).val() as string);
  }

  onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      this.onSubmit(e as Event);
    }
  }

  render() {
    return (
      <form
        autocomplete="off"
        class={`flex flex-row gap-2 p-2 message-form fixed bottom-0 w-96 max-w-screen bg-black ${
          this.props.class || ''
        }`}
        onSubmit={(e: Event) => this.onSubmit(e)}
      >
        <input
          className="input input-sm flex-1 new-msg"
          onInput={(e: Event) => this.onMsgTextInput(e)}
          onKeyDown={(e: KeyboardEvent) => this.onKeyDown(e)}
          type="text"
          placeholder="Type a message"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="sentences"
          spellCheck={true}
        />
        <button className="btn btn-neutral btn-sm" style={{ marginRight: '0' }}>
          <PaperAirplaneIcon onClick={(e: MouseEvent) => this.onSubmit(e as Event)} width="24" />
        </button>
      </form>
    );
  }
}

export default ChatMessageForm;
