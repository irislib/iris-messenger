import { html } from 'htm/preact';
import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Identicon from '../../components/Identicon';
import Name from '../../components/Name';
import Helpers from '../../Helpers';
import Nostr from '../../Nostr';

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
    const event = Nostr.eventsById.get(this.props.latestMsgId);
    if (event) {
      this.setState({ latest: event });
      Nostr.decryptMessage(this.props.latestMsgId, (latestText) => {
        this.setState({ latestText });
      });
    }
  }

  componentDidMount() {
    this.getLatestMsg();
    const path = 'chats/' + this.props.chat + '/lastOpened';
    const myPub = iris.session.getKey().secp256k1.rpub;
    Nostr.public.get({ path, authors: [myPub] }, (entry) => {
      this.setState({ lastOpened: entry.value });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.latestMsgId !== this.props.latestMsgId) {
      this.getLatestMsg();
    }
  }

  hasUnseen() {
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
    if (chat === (iris.session.getKey().secp256k1.rpub)) {
      name = html`📝 <b>${t('note_to_self')}</b>`;
    }*/

    let iconEl = chat.picture
      ? html`<div class="identicon-container">
          <img src="${chat.picture}" class="round-borders" height="49" width="49" alt="" />
        </div>`
      : html`<${Identicon} str=${chat} width="49" />`;

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

    // TODO use button so we can use keyboard to navigate
    return html`
      <div
        onKeyUp=${(e) => this.onKeyUp(e)}
        role="button"
        tabindex="0"
        class="chat-item ${activity} ${hasUnseen} ${active}"
        onClick=${() => route(`/chat/${this.props.chat}`)}
      >
        ${iconEl}
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
