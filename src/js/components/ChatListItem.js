import { html, Component } from '../lib/htm.preact.js';
import {activeChat, showChat} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Identicon from './Identicon.js';

const seenIndicator = html`<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

class ChatListItem extends Component {
  constructor() {
    super();
    this.state = {latest: {}, name: ''};
    this.eventListeners = [];
  }

  componentDidMount() {
    const chatId = this.props.chatId;
    localState.get('chats').get(chatId).get('name').on((name, a, b, event) => {
      this.setState({name});
      this.eventListeners.push(event);
    });
    localState.get('chats').get(chatId).get('latest').on((latest, a, b, event) => {
      /*
      if (msg.attachments) {
        text = '['+ t('attachment') +']' + (text.length ? ': ' + text : '');
      } else {
        text = msg.text;
      }
      if (chats[chatId] && chats[chatId].uuid && !msg.selfAuthored && msg.info.from && chats[chatId].participantProfiles[msg.info.from].name) {
        text = chats[chatId].participantProfiles[msg.info.from].name + ': ' + text;
      }
      */
      latest.time = latest.time && new Date(latest.time);
      console.log('latest', latest);
      this.setState({latest});
      this.eventListeners.push(event);
    });
  }

  componentWillUnmount() {
    console.log('chatlistitem unmount');
    this.eventListeners.forEach(e => e.off());
  }

  onClick() {
    showChat(this.props.chatId);
    this.setState();
  }

  render() {
    const chat = chats[this.props.chatId];
    const active = this.props.active ? "active" : "";
    const seen = this.props.active ? "seen" : "";
    const delivered = this.props.active ? "delivered" : "";
    return html`
    <div class="chat-item ${active} ${seen} ${delivered}" onClick=${() => this.onClick()}>
      <${Identicon} str=${this.props.chatId} width=49/>
      <div class="text">
        <div>
          <span class="name">${this.state.name}</span>
          <small class="latest-time">${this.state.latest.time}</small>
        </div>
        <small class="typing-indicator">${t('typing')}</small>
        <small class="latest">
          ${this.state.latest.selfAuthored && seenIndicator}
          ${this.state.latest.text}
        </small>
        <span class="unseen"></span>
      </div>
    </div>
    `;
  }
}

export default ChatListItem;
