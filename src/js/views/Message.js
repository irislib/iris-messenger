import { html } from '../Helpers.js';
import PublicMessage from '../components/PublicMessage.js';
import MessageForm from '../components/MessageForm.js';
import { route } from '../lib/preact-router.es.js';
import View from './View.js';

class Message extends View {
  constructor() {
    super();
    this.class = "public-messages-view";
  }

  renderView() {
    let content;
    if (this.props.hash === 'new') {
      content = html`
        <${MessageForm} activeChat="public" autofocus=${true} onSubmit=${() => route('/')}/>
      `;
    } else {
      content = html`
        <${PublicMessage} hash=${this.props.hash} showName=${true} showReplies=${true} />
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
