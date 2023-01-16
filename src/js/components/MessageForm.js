import { Component } from 'preact';

import Nostr from '../Nostr';

const mentionRegex = /\B@[\u00BF-\u1FFF\u2C00-\uD7FF\w]*$/;

export default class MessageForm extends Component {
  async sendNostr(msg) {
    const event = {
      kind: 1,
      content: msg.text,
    };
    if (msg.replyingTo) {
      const id = Nostr.toNostrHexAddress(msg.replyingTo);
      const replyingTo = await Nostr.getMessageById(id);
      event.tags = [
        ['e', id, Nostr.getSomeRelayUrl(), 'reply'],
        ['p', replyingTo.pubkey],
      ];
      for (const tag of replyingTo.tags) {
        if (tag[0] === 'p') {
          event.tags.push(tag);
        }
      }
      // TODO add p tags from replied event, and replied event.pubkey
    }
    // unique tagged users
    const taggedUsers = msg.text.match(/@npub\w+/g)?.filter((v, i, a) => a.indexOf(v) === i);
    if (taggedUsers) {
      event.tags = event.tags || [];
      for (const tag of taggedUsers) {
        const hexTag = Nostr.toNostrHexAddress(tag.slice(1));
        const newTag = ['p', hexTag];
        // add if not already present
        if (!event.tags.find((t) => t[0] === newTag[0] && t[1] === newTag[1])) {
          // TODO this still adds duplicate?
          event.tags.push(newTag);
        }
        // replace occurrences in event.content with #[n] where n is index in event.tags
        const index = event.tags.findIndex((t) => t[0] === newTag[0] && t[1] === newTag[1]);
        event.content = event.content.replace(tag, `#[${index}]`);
      }
    }
    console.log('sending event', event);
    return Nostr.publish(event);
  }

  onMsgTextPaste(event) {
    const pasted = (event.clipboardData || window.clipboardData).getData('text');
    const magnetRegex = /^magnet:\?xt=urn:btih:*/;
    if (
      (pasted !== this.state.torrentId && pasted.indexOf('.torrent') > -1) ||
      pasted.match(magnetRegex)
    ) {
      this.setState({ torrentId: pasted });
    }
  }

  checkMention(event) {
    const val = event.target.value.slice(0, event.target.selectionStart);
    const matches = val.match(mentionRegex);
    if (matches) {
      const match = matches[0].slice(1);
      if (!Nostr.toNostrHexAddress(match)) {
        this.setState({ mentioning: match });
      }
    } else if (this.state.mentioning) {
      this.setState({ mentioning: null });
    }
  }
}
