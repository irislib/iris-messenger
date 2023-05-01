import { html } from 'htm/preact';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Identicon from '../../components/Identicon';
import Name from '../../components/Name';
import Helpers from '../../Helpers';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Session from '../../nostr/Session';

class ChatListItem extends Component {
  constructor() {
    super();
    this.state = {
      latest: {},
      latestText: '',
    };
  }

  onKeyUp(e) {
    // if enter was pressed, click the element
    if (e.keyCode === 13) {
      e.target.click();
    }
  }

  getLatestMsg() {
    if (!this.props.latestMsgId) {
      return;
    }
    const event = Events.db.by('id', this.props.latestMsgId);
    if (event) {
      this.setState({ latest: event });
      Key.decryptMessage(this.props.latestMsgId, (latestText) => {
        this.setState({ latestText });
      });
    }
  }

  componentDidMount() {
    this.getLatestMsg();
    const path = 'chats/' + this.props.chat + '/lastOpened';
    Session.public.get(path, (lastOpened) => {
      this.setState({ lastOpened });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.latestMsgId !== this.props.latestMsgId) {
      this.getLatestMsg();
    }
  }

  hasUnseen() {
    if (this.state.latest.pubkey === Key.getPubKey()) {
      return false;
    }
    return !this.props.active && !(this.state.latest.created_at <= this.state.lastOpened);
  }

  render() {
    const chat = this.props.chat;
    const active = this.props.active ? 'active-item' : '';
    /*
    const seen = chat.theirMsgsLastSeenTime >= chat.latestTime ? 'seen' : '';
    const delivered = chat.theirLastActiveTime >= chat.latestTime ? 'delivered' : '';

     */
    const hasUnseen = this.hasUnseen() ? 'has-unseen' : '';
    const unseenEl = this.hasUnseen() ? html`<span class="unseen"></span>` : '';
    const activity = ['online', 'active'].indexOf(chat.activity) > -1 ? chat.activity : '';
    //const time = chat.latestTime && new Date(chat.latestTime);
    //let latestTimeText = Helpers.getRelativeTimeText(time);

    /*let name = chat.name;
    if (chat === (Key.getPubKey())) {
      name = html`📝 <b>${t('note_to_self')}</b>`;
    }*/

    /*
    const latestEl =
      chat.isTyping || !chat.latest
        ? ''
        : html`<small class="latest">
            ${chat.latest.selfAuthored && seenIndicator} ${chat.latest.text}
          </small>`;


    const typingIndicator = chat.isTyping
      ? html`<small class="typing-indicator">${t('typing')}</small>`
      : '';

    const onlineIndicator = chat.id.length > 36 ? html`<div class="online-indicator"></div>` : '';
     */

    const time =
      (this.state.latest.created_at &&
        Helpers.getRelativeTimeText(new Date(this.state.latest.created_at * 1000))) ||
      '';

    const npub = Key.toNostrBech32Address(chat, 'npub');

    // TODO use button so we can use keyboard to navigate
    return html`
      <div
        onKeyUp=${(e) => this.onKeyUp(e)}
        role="button"
        tabindex="0"
        class="chat-item ${activity} ${hasUnseen} ${active}"
        onClick=${() => route(`/chat/${npub}`)}
      >
        <${Identicon} str=${npub} width="49" />
        <div class="text">
          <div>
            <span class="name"><${Name} pub=${this.props.chat} /></span>
            <small class="latest-time">${time}</small>
          </div>
          <small class="latest"> ${this.state.latestText} </small>
          ${unseenEl}
        </div>
      </div>
    `;
  }
}

export default ChatListItem;
