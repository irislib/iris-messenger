import { html, Component } from '../lib/htm.preact.js';
import {showChat} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Session from '../Session.js';
import Identicon from './Identicon.js';

const seenIndicator = html`<span class="seen-indicator"><svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

class ChatListItem extends Component {
  constructor() {
    super();
    this.state = {latest: {}, chat: {}};
    this.eventListeners = [];
  }

  componentDidMount() {
    const chat = this.props.chat;
    const time = chat.latestTime && new Date(chat.latestTime);
    let latestTimeText = time && iris.util.getDaySeparatorText(time, time.toLocaleDateString({dateStyle:'short'}));
    latestTimeText = t(latestTimeText);
    if (latestTimeText === t('today')) { latestTimeText = iris.util.formatTime(time); }
    this.setState({chat, latestTimeText});
    localState.get('chats').get(chat.id).get('latest').on((latest, a, b, event) => {
      /*
      if (msg.attachments) {
        text = '['+ t('attachment') +']' + (text.length ? ': ' + text : '');
      } else {
        text = msg.text;
      }
      if (chats[chat.id] && chats[chat.id].uuid && !msg.selfAuthored && msg.info.from && chats[chat.id].participantProfiles[msg.info.from].name) {
        text = chats[chat.id].participantProfiles[msg.info.from].name + ': ' + text;
      }
      */
      if (latest.time < chat.latestTime) { return; }
      latest.time = latest.time && new Date(latest.time);
      this.setState({latest});
      this.eventListeners.push(event);
    });
  }

  componentWillUnmount() {
    console.log('chatlistitem unmount');
    this.eventListeners.forEach(e => e.off());
  }

  onClick() {
    // chatListEl.find('.unseen').empty().hide();
    showChat(this.props.chat.id);
    this.setState();
  }

  render() {
    const chat = this.props.chat;
    const active = this.props.active ? "active" : "";
    const seen = chat.theirMsgsLastSeenTime >= chat.latestTime ? "seen" : "";
    const delivered = chat.theirLastActiveTime >= chat.latestTime ? "delivered" : "";
    const hasUnseen = chat.unseen ? 'has-unseen' : '';
    const unseenEl = chat.unseen ? html`<span class="unseen">${chat.unseen}</span>` : '';

    let name = chat.name;
    if (chat.id === Session.getKey().pub) {
      name = html`📝 <b>${t('note_to_self')}</b>`;
    }

    const photo = this.props.photo;
    let iconEl;
    if (photo) {
      iconEl = html`<div class="identicon-container"><img src="${this.props.photo}" class="round-borders" height=49 width=49 alt=""/></div>`;
    } else {
      iconEl = html`<${Identicon} str=${chat.id} width=49/>`;
    }
    return html`
    <div class="chat-item ${hasUnseen} ${active} ${seen} ${delivered}" onClick=${() => this.onClick()}>
      ${iconEl}
      <div class="text">
        <div>
          <span class="name">${name}</span>
          <small class="latest-time">${this.state.latestTimeText}</small>
        </div>
        <small class="typing-indicator">${t('typing')}</small>
        <small class="latest">
          ${this.state.latest.selfAuthored && seenIndicator}
          ${this.state.latest.text}
        </small>
        ${unseenEl}
      </div>
    </div>
    `;
  }
}

export default ChatListItem;
