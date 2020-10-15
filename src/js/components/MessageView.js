import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import MessageForm from './MessageForm.js';

class MessageView extends Component {
  render() {
    let content;
    if (this.props.hash === 'new') {
      content = html`
        <${MessageForm} activeChat="public" autofocus=${true}/>
      `;
    } else {
      content = html`
        <${PublicMessage} hash=${this.props.hash} showName=${true} showReplies=${true} />
      `;
    }
    return html`
      <div class="main-view public-messages-view">
        <div id="message-list" class="centered-container">
          ${content}
        </div>
      </div>
    `;
  }
}

export default MessageView;
