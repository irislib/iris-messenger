import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import Message from './Message.js';
import PublicMessages from '../PublicMessages.js';
import {localState} from '../Main.js';
import Session from '../Session.js';
import {chats} from '../Chat.js';
import { route } from '../lib/preact-router.es.js';
import {translate as t} from '../Translation.js';

let sortedMessages = [];

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = { sortedMessages: [] };
    this.following = {};
    this.sortedMessages = [];
  }

  follow(pub) {
    if (this.following[pub]) return;
    this.following[pub] = {};
    PublicMessages.getMessages(pub, (msg, info) => {
      console.log('got msg ',msg);
      msg.info = info;
      this.sortedMessages.push(msg);
      this.sortedMessages = this.sortedMessages.sort();
      this.setState({});
    });
  }

  componentDidMount() {
    this.follow(Session.getKey().pub);
    publicState.user().get('follow').map().on((follows, pub, b, e) => {
      this.eventListeners['follow'] = e;
      console.log('yo', pub, follows);
      if (follows) {
        this.follow(pub);
      } else {
        delete this.following[pub];
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    const k = Session.getKey() || {};
    const author = this.state.msg && this.state.msg.author && this.state.msg.author.keyID;
    const actions = author && author === k.pub ? html`<button onClick=${() => this.setState({deleting:true})}>${t('delete')}</button>` : '';
    return html`
      <div class="main-view public-messages-view" id="message-view">
        <div id="message-list">
          ${this.sortedMessages.map(m =>
            html`<${Message} ...${m} showName=${true} chatId=${m.info.from}/>`
          )}
        </div>
        <div id="attachment-preview" style="display:none"></div>
      </div>
    `;
  }
}

export default FeedView;
