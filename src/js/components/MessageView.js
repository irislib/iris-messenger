import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import MessageForm from './MessageForm.js';
import { route } from '../lib/preact-router.es.js';
import IrisView from './IrisView.js';

class MessageView extends IrisView {
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

export default MessageView;
