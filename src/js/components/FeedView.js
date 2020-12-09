import { Component } from '../lib/preact.js';
import Helpers, { html } from '../Helpers.js';
import PublicMessages from '../PublicMessages.js';
import {localState} from '../Main.js';
import MessageForm from './MessageForm.js';
import Identicon from './Identicon.js';
import FollowButton from './FollowButton.js';
import CopyButton from './CopyButton.js';
import MessageFeed from './MessageFeed.js';
import Session from '../Session.js';
import {translate as t} from '../Translation.js';

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class FeedView extends Component {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = new Set();
    this.state = {sortedMessages: []};
    this.messages = {};
  }

  getMessages(/*show2ndDegreeFollows*/) {
    //const followsList = show2ndDegreeFollows ? localState.get('follows') : publicState.user().get('follow');
    const followsList = localState.get('follows');
    followsList.map().once((follows, pub) => {
      if (follows) {
        if (this.following.has(pub)) return;
        if (Session.getPubKey() !== pub) {
          this.state.noFollows && localState.get('noFollows').put(false);
        }
        this.following.add(pub);
        PublicMessages.getMessages(pub, (hash, time) => {
          if (Session.getPubKey() !== pub) {
            this.state.noMessages && localState.get('noMessages').put(false);
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
    /*
    localState.get('show2ndDegreeFollows').on(show => {
      if (show === this.state.show2ndDegreeFollows) return;
      this.setState({show2ndDegreeFollows: show});
      //this.getMessages(show);
    }); */
    localState.get('noFollows').on(noFollows => this.setState({noFollows}));
    localState.get('noFollowers').on(noFollowers => this.setState({noFollowers}));
    localState.get('noMessages').on(noMessages => this.setState({noMessages}));
    this.getMessages();
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  getNotification() {
    if (this.state.noFollows || this.state.noMessages) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('follow_someone_info')}</p>
            <div class="profile-link-container">
              <a href="/profile/${SUGGESTED_FOLLOW}" class="profile-link">
                <${Identicon} str=${SUGGESTED_FOLLOW} width=40 />
                <iris-text path="profile/name" user=${SUGGESTED_FOLLOW}/>
              </a>
              <${FollowButton} id=${SUGGESTED_FOLLOW} />
            </div>
            <p>${t('alternatively')} <a href="/profile/${Session.getPubKey()}">${t('give_your_profile_link_to_someone')}</a>.</p>
          </div>
        </div>
      `
    }
    if (this.state.noFollowers) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>${t('no_followers_yet')}</p>
            <p><${CopyButton} text=${t('copy_link')} copyStr=${Helpers.getProfileLink(Session.getPubKey())}/></p>
            <small>${t('no_followers_yet_info')}</small>
          </div>
        </div>
      `;
    }
    return '';
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
          ${this.getNotification()}
          <${MessageFeed} node=${localState.get('feed')} />
        </div>
      </div>
    `;
  }
}

export default FeedView;
