import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import PublicMessages from '../PublicMessages.js';
import {publicState} from '../Main.js';
import Session from '../Session.js';
import MessageForm from './MessageForm.js';

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = new Set();
    this.sortedMessages = [];
    this.names = {};
  }

  follow(pub) {
    if (this.following.has(pub)) return;
    this.following.add(pub);
    publicState.user(pub).get('profile').get('name').on((name, a, b, e) => {
      this.eventListeners[pub + 'name'] = e;
      this.names[pub] = name;
      this.setState({});
    })
    PublicMessages.getMessages(pub, (msg, info) => {
      if (msg === null) {
        this.sortedMessages = this.sortedMessages.filter(m => !(m.time === info.time && m.info.from === info.from));
      } else {
        clearTimeout(this.noMessagesTimeout);
        if (this.state.noMessages) { this.setState({noMessages:false}); }
        msg.info = info;
        this.sortedMessages.push(msg);
        this.sortedMessages.sort((a,b) => a.time < b.time ? 1 : -1);
      }
      this.setState({});
    });
  }

  componentDidMount() {
    this.follow(Session.getKey().pub);
    const followingNobodyTimeout = setTimeout(() => {
      this.setState({followingNobody: true});
    }, 2000);
    this.noMessagesTimeout = setTimeout(() => {
      this.setState({noMessages: true});
    }, 2000);
    publicState.user().get('follow').map().on((follows, pub, b, e) => {
      this.eventListeners['follow'] = e;
      if (follows) {
        clearTimeout(followingNobodyTimeout);
        if (this.state.followingNobody) { this.setState({followingNobody: false}); }
        this.follow(pub);
      } else {
        this.following.delete(pub);
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
          <${MessageForm} activeChat="public" autofocus=${false}/>
          ${this.sortedMessages.map(m =>
            html`<${PublicMessage} ...${m} key=${m.time} showName=${true} name=${this.names[m.info.from]}/>`
          )}
          ${this.state.followingNobody || this.state.noMessages ? html`
            <div class="msg">
              <div class="msg-content">
                <p>Follow someone to see their posts here!</p>
                <p>Suggestion: <a href="/profile/hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU">Creator of this Iris distribution</a></p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

export default FeedView;
