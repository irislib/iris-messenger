import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import {showChat} from '../Chat.js';
import { translate as t } from '../Translation.js';
import {localState} from '../Main.js';
import Session from '../Session.js';
import Identicon from './Identicon.js';
import Helpers from '../Helpers.js';

const seenIndicator = html`<span class="seen-indicator"><svg viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg></span>`;

class ChatListItem extends Component {
  constructor() {
    super();
    this.state = {latest: {}};
    this.eventListeners = [];
  }

  componentDidMount() {
    const chat = this.props.chat;
    localState.get('chats').get(chat.id).get('latest').on((latest, a, b, event) => {
      /*
      if (msg.attachments) {
        text = '['+ t('attachment') +']' + (text.length ? ': ' + text : '');
      } else {
        text = msg.text;
      }
      if (chat && chat.uuid && !msg.selfAuthored && msg.info.from && chat.participantProfiles[msg.info.from].name) {
        text = chat.participantProfiles[msg.info.from].name + ': ' + text;
      }
      */
      if (latest.time < chat.latestTime) { return; }
      latest.time = latest.time && new Date(latest.time);
      this.setState({latest});
      this.eventListeners.push(event);
    });
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }

  onClick() {
    // chatListEl.find('.unseen').empty().hide();
    showChat(this.props.chat.id);
  }

  render() {
    const chat = this.props.chat;
    const active = this.props.active ? "active" : "";
    const seen = chat.theirMsgsLastSeenTime >= chat.latestTime ? "seen" : "";
    const delivered = chat.theirLastActiveTime >= chat.latestTime ? "delivered" : "";
    const hasUnseen = chat.unseen ? 'has-unseen' : '';
    const unseenEl = chat.unseen ? html`<span class="unseen">${chat.unseen}</span>` : '';
    const activity = ['online', 'active'].indexOf(chat.activity) > -1 ? chat.activity : '';
    const time = chat.latestTime && new Date(chat.latestTime);
    let latestTimeText = Helpers.getRelativeTimeText(time);

    let name = chat.name;
    if (chat.id === (Session.getKey() || {}).pub) {
      name = html`📝 <b>${t('note_to_self')}</b>`;
    }

    const photo = this.props.photo;
    let iconEl;
    if (photo) {
      iconEl = html`<div class="identicon-container"><img src="${this.props.photo}" class="round-borders" height=49 width=49 alt=""/></div>`;
    } else {
      iconEl = html`<${Identicon} str=${chat.id} width=49/>`;
    }

    const latestEl = chat.isTyping ? '' : html`<small class="latest">
      ${this.state.latest.selfAuthored && seenIndicator}
      ${this.state.latest.text}
    </small>`;

    const typingIndicator = chat.isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : '';

    return html`
    <div class="chat-item ${activity} ${hasUnseen} ${active} ${seen} ${delivered}" onClick=${() => this.onClick()}>
      ${iconEl}
      <div class="online-indicator"></div>
      <div class="text">
        <div>
          <span class="name">${name}</span>
          <small class="latest-time">${latestTimeText}</small>
        </div>
        ${typingIndicator}
        ${latestEl}
        ${unseenEl}
      </div>
    </div>
    `;
  }
}

export default ChatListItem;
