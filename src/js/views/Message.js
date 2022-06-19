import { html } from 'htm/preact';
import PublicMessage from '../components/PublicMessage';
import FeedMessageForm from '../components/FeedMessageForm';
import { route } from 'preact-router';
import View from './View';

class Message extends View {
  constructor() {
    super();
    this.class = "public-messages-view";
  }

  renderView() {

    let content;
    if (this.props.hash === 'new') {
      content = html`
        <${FeedMessageForm} activeChat="public" autofocus=${true} onSubmit=${() => route('/')}/>
      `;
    } else {
      content = html`
        <${PublicMessage} key=${this.props.hash} standalone=${true} hash=${this.props.hash} showName=${true} showReplies=${true} />
      `;
    }
    return html`
      <div id="message-list" class="centered-container">
        ${content}
      </div>
    `;
  }
}

export default Message;
