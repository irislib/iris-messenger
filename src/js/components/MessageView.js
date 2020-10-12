import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';

class MessageView extends Component {
  render() {
    return html`
      <div class="main-view public-messages-view">
        <div id="message-list" class="centered-container">
          <${PublicMessage} hash=${this.props.hash} showName=${true} showReplies=${true} />
        </div>
      </div>
    `;
  }
}

export default MessageView;
