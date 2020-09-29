import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import Message from './Message.js';
import PublicMessages from '../PublicMessages.js';
import {publicState} from '../Main.js';
import Session from '../Session.js';
import MessageForm from './MessageForm.js';

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = {};
    this.sortedMessages = [];
    this.names = {};
  }

  follow(pub) {
    if (this.following[pub]) return;
    this.following[pub] = {};
    publicState.user(pub).get('profile').get('name').on((name, a, b, e) => {
      this.eventListeners[pub + 'name'] = e;
      this.names[pub] = name;

      this.setState({});
    })
    PublicMessages.getMessages(pub, (msg, info) => {
      msg.info = info;
      this.sortedMessages.push(msg);
      this.sortedMessages.sort((a,b) => a.time < b.time ? 1 : -1);
      this.setState({});
    });
  }

  componentDidMount() {
    this.follow(Session.getKey().pub);
    publicState.user().get('follow').map().on((follows, pub, b, e) => {
      this.eventListeners['follow'] = e;
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
    return html`
      <div class="main-view public-messages-view" id="message-view">
        <div class="centered-container">
          <${MessageForm} activeChat="public"/>
          <div id="attachment-preview" style="display:none"></div>
          ${this.sortedMessages.map(m =>
            html`<${Message} ...${m} public=${true} key=${m.time} showName=${true} name=${this.names[m.info.from]}/>`
          )}
        </div>
      </div>
    `;
  }
}

export default FeedView;
