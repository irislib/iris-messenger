import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import PublicMessages from '../PublicMessages.js';
import Session from '../Session.js';
import {chats} from '../Chat.js';
import { route } from '../lib/preact-router.es.js';
import {translate as t} from '../Translation.js';


class MessageView extends Component {
  render() {
    const k = Session.getKey() || {};
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
