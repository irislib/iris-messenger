import { html } from 'htm/preact';
import { route } from 'preact-router';

import FeedMessageForm from '../components/FeedMessageForm';
import PublicMessage from '../components/PublicMessage';
import Nostr from '../Nostr';

import View from './View';

class Message extends View {
  constructor() {
    super();
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    const nostrBech32Id = Nostr.toNostrBech32Address(this.props.hash, 'note');
    if (nostrBech32Id && this.props.hash !== nostrBech32Id) {
      route(`/post/${nostrBech32Id}`, true);
      return;
    }
  }

  renderView() {
    let content;
    if (this.props.hash === 'new') {
      content = html`
        <${FeedMessageForm}
          activeChat="public"
          forceAutofocusMobile=${true}
          autofocus=${true}
          onSubmit=${() => route('/')}
        />
      `;
    } else {
      content = html`
        <${PublicMessage}
          key=${this.props.hash}
          standalone=${true}
          hash=${this.props.hash}
          showName=${true}
          showReplies=${true}
        />
      `;
    }
    return html` <div class="centered-container">${content}</div> `;
  }
}

export default Message;
