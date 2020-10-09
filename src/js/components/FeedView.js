import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import PublicMessages from '../PublicMessages.js';
import {publicState} from '../Main.js';
import Session from '../Session.js';
import MessageForm from './MessageForm.js';
import Identicon from './Identicon.js';
import FollowButton from './FollowButton.js';

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = new Set();
    this.sortedMessages = [];
    this.names = {};
    this.state = {sortedMessages: []};
  }

  follow(pub) {
    if (this.following.has(pub)) return;
    this.following.add(pub);
    publicState.user(pub).get('profile').get('name').on((name, a, b, e) => {
      this.eventListeners[pub + 'name'] = e;
      this.names[pub] = name;
      this.setState({});
    });
    PublicMessages.getMessages(pub, (msg, info) => {
      if (msg === null) {
        this.sortedMessages = this.sortedMessages.filter(m => !(m.time === info.time && m.info.from === info.from));
      } else {
        if (msg.replyingTo) return; // filter out reply messages for now
        clearTimeout(this.noMessagesTimeout);
        if (this.state.noMessages) { this.setState({noMessages:false}); }
        msg.info = info;
        this.sortedMessages.push(msg);
        this.sortedMessages.sort((a,b) => a.time < b.time ? 1 : -1);
      }
      this.setState({sortedMessages: [].concat(this.sortedMessages)});
    });
  }

  getMessages(show2ndDegreeFollows) {
    const followsList = show2ndDegreeFollows ? localState.get('follows') : publicState.user().get('follow');
    followsList.map().once((follows, pub) => {
      if (follows) {
        clearTimeout(this.followingNobodyTimeout);
        if (this.state.followingNobody) { this.setState({followingNobody: false}); }
        this.follow(pub);
      } else {
        this.following.delete(pub);
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
    });
  }

  componentDidMount() {
    this.follow(Session.getKey().pub);
    this.followingNobodyTimeout = setTimeout(() => {
      this.setState({followingNobody: true});
    }, 2000);
    this.noMessagesTimeout = setTimeout(() => {
      this.setState({noMessages: true});
    }, 2000);
    localState.get('show2ndDegreeFollows').on(show => {
      if (show === this.state.show2ndDegreeFollows) return;
      this.setState({show2ndDegreeFollows: show});
      this.getMessages(show);
    });
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    const f = Session.getFollows();
    return html`
      <div class="main-view public-messages-view" id="message-view">
        <div class="centered-container">
          <${MessageForm} activeChat="public" autofocus=${false}/>

          <div class="feed-settings">
            <button onClick="${() => {
                localState.get('show2ndDegreeFollows').put(!this.state.show2ndDegreeFollows);
              }}">
              ${this.state.show2ndDegreeFollows ? 'Hide' : 'Show'} messages from 2nd degree follows
            </button>
          </div>

          ${this.state.sortedMessages
            .filter(m => (this.state.show2ndDegreeFollows || f[m.info.from] && f[m.info.from].followDistance <= 1))
            .map(m =>
              html`<${PublicMessage} ...${m} key=${m.time} showName=${true} name=${this.names[m.info.from]}/>`
            )}
          ${this.state.followingNobody || this.state.noMessages ? html`
            <div class="msg">
              <div class="msg-content">
                <p>Follow someone to see their posts here! Suggestion:</p>
                <div class="profile-link-container">
                  <a href="/profile/${SUGGESTED_FOLLOW}" class="profile-link">
                    <${Identicon} str=${SUGGESTED_FOLLOW} width=40 />
                    Creator of this Iris distribution
                  </a>
                  <${FollowButton} id=${SUGGESTED_FOLLOW} />
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

export default FeedView;
