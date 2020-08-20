import { html, Component } from '../lib/htm.preact.js';
import {activeChat, showChat} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Identicon from './Identicon.js';

class ChatListItem extends Component {
  constructor() {
    super();
    this.state = {latestText: '', latestTime: '', name: ''};
    this.eventListeners = [];
  }

  componentDidMount() {
    const chatId = this.props.chatId;
    localState.get('chats').get(chatId).get('name').on((name, a, b, event) => {
      this.setState({name});
      this.eventListeners.push(event);
    });
    localState.get('chats').get(chatId).get('latest').get('text').on((latestText, a, b, event) => {
      this.setState({latestText});
      this.eventListeners.push(event);
    });
    localState.get('chats').get(chatId).get('latest').get('time').on((latestTime, a, b, event) => {
      this.setState({latestTime: iris.util.formatDate(new Date(latestTime))});
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
    return html`
    <div class="chat-item ${activeChat === this.props.chatId ? "active" : ""}" onClick=${() => this.onClick()}>
      <${Identicon} str=${this.props.chatId} width=49/>
      <div class="text">
        <div>
          <span class="name">${this.state.name}</span>
          <small class="latest-time">${this.state.latestTime}</small>
        </div>
        <small class="typing-indicator">${t('typing')}</small>
        <small class="latest">${this.state.latestText}</small>
        <span class="unseen"></span>
      </div>
    </div>
    `;
  }
}

export default ChatListItem;
