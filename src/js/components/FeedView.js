import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessages from '../PublicMessages.js';
import {localState} from '../Main.js';
import MessageForm from './MessageForm.js';
import Identicon from './Identicon.js';
import FollowButton from './FollowButton.js';
import MessageFeed from './MessageFeed.js';
import Session from '../Session.js';

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = new Set();
    this.state = {sortedMessages: []};
    this.messages = {};
  }

  getMessages(show2ndDegreeFollows) {
    //const followsList = show2ndDegreeFollows ? localState.get('follows') : publicState.user().get('follow');
    const followsList = localState.get('follows');
    followsList.map().once((follows, pub) => {
      if (follows) {
        if (Session.getPubKey() !== pub) {
          clearTimeout(this.followingNobodyTimeout);
          this.state.followingNobody && this.setState({followingNobody: false});
        }
        if (this.following.has(pub)) return;
        this.following.add(pub);
        PublicMessages.getMessages(pub, (hash, time) => {
          if (Session.getPubKey() !== pub) {
            clearTimeout(this.noMessagesTimeout);
            this.state.noMessages && this.setState({noMessages: false});
          }
          const id = time + pub.slice(0,20);
          if (hash) {
            localState.get('feed').get(id).put(hash);
          } else {
            localState.get('feed').get(id).put(null);
          }
        });
      } else {
        this.following.delete(pub);
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
    });
  }

  componentDidMount() {
    this.followingNobodyTimeout = setTimeout(() => {
      this.setState({followingNobody: true});
    }, 2000);
    this.noMessagesTimeout = setTimeout(() => {
      this.setState({noMessages: true});
    }, 2000);
    localState.get('show2ndDegreeFollows').on(show => {
      if (show === this.state.show2ndDegreeFollows) return;
      this.setState({show2ndDegreeFollows: show});
      //this.getMessages(show);
    });
    this.getMessages();
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  render() {
    return html`
      <div class="main-view public-messages-view" id="message-view">
        <div class="centered-container">
          <${MessageForm} activeChat="public" class="hidden-xs" autofocus=${false}/>

          <!--<div class="feed-settings">
            <button onClick="${() => {
                localState.get('show2ndDegreeFollows').put(!this.state.show2ndDegreeFollows);
              }}">
              ${this.state.show2ndDegreeFollows ? 'Hide' : 'Show'} messages from 2nd degree follows
            </button>
          </div>-->

          <${MessageFeed} node=${localState.get('feed')} />
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
