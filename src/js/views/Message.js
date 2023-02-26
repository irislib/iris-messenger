import { html } from 'htm/preact';
import { route } from 'preact-router';

import FeedMessageForm from '../components/FeedMessageForm';
import PublicMessage from '../components/PublicMessage';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation';

import View from './View';

class Message extends View {
  constructor() {
    super();
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    const nostrBech32Id = Key.toNostrBech32Address(this.props.hash, 'note');
    if (nostrBech32Id && this.props.hash !== nostrBech32Id) {
      route(`/post/${nostrBech32Id}`, true);
      return;
    }
    this.restoreScrollPosition();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.hash !== this.props.hash) {
      this.restoreScrollPosition();
    }
  }

  renderView() {
    let content;
    if (this.props.hash === 'new') {
      content = html`
        <div class="mar-top15">
          <${FeedMessageForm}
            placeholder=${t('whats_on_your_mind')}
            activeChat="public"
            forceAutofocusMobile=${true}
            autofocus=${true}
            onSubmit=${() => route('/')}
          />
        </div>
      `;
    } else {
      content = html`
        <${PublicMessage}
          key=${this.props.hash}
          standalone=${true}
          hash=${this.props.hash}
          showName=${true}
          showReplies=${Infinity}
          showRepliedMsg=${true}
        />
      `;
    }
    return html` <div class="centered-container">${content}</div> `;
  }
}

export default Message;
