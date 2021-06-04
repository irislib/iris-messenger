import Helpers, { html } from '../Helpers.js';
import State from '../State.js';
import PublicMessageForm from '../components/PublicMessageForm.js';
import Identicon from '../components/Identicon.js';
import FollowButton from '../components/FollowButton.js';
import CopyButton from '../components/CopyButton.js';
import MessageFeed from '../components/MessageFeed.js';
import Session from '../Session.js';
import View from './View.js';
import {translate as t} from '../Translation.js';

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class Feed extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.following = new Set();
    this.state = {sortedMessages: []};
    this.messages = {};
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  getMessagesByUser(pub, cb) {
    const seen = new Set();
    State.public.user(pub).get(this.props.index || 'msgs').map().on(async (hash, time) => {
      if (typeof hash === 'string' && !seen.has(hash)) {
        seen.add(hash);
        cb(hash, time);
      } else if (hash === null) {
        cb(null, time);
      }
    });
  }

  getMessages(/*show2ndDegreeFollows*/) {
    //const followsList = show2ndDegreeFollows ? State.local.get('follows') : State.public.user().get('follow');
    const followsList = State.local.get('follows');
    followsList.map().once((follows, pub) => {
      if (follows) {
        if (this.following.has(pub)) return;
        if (Session.getPubKey() !== pub) {
          this.state.noFollows && State.local.get('noFollows').put(false);
        }
        this.following.add(pub);
        this.getMessagesByUser(pub, (hash, time) => {
          if (Session.getPubKey() !== pub) {
            this.state.noMessages && State.local.get('noMessages').put(false);
          }
          const id = time + pub.slice(0,20);
          if (hash) {
            State.local.get(this.props.index || 'feed').get(id).put(hash);
          } else {
            State.local.get(this.props.index || 'feed').get(id).put(null);
          }
        });
      } else {
        this.following.delete(pub);
        this.eventListeners[pub] && this.eventListeners[pub].off();
      }
    });
  }

  search() {
    const searchTerm = this.props.term && this.props.term.toLowerCase();
    this.setState({searchTerm});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.term !== this.props.term) {
      this.search();
    }
  }

  componentDidMount() {
    this.search();
    /*
    State.local.get('show2ndDegreeFollows').on(show => {
      if (show === this.state.show2ndDegreeFollows) return;
      this.setState({show2ndDegreeFollows: show});
      //this.getMessages(show);
    }); */
    State.local.get('noFollows').on(noFollows => this.setState({noFollows}));
    State.local.get('noFollowers').on(noFollowers => this.setState({noFollowers}));
    State.local.get('noMessages').on(noMessages => this.setState({noMessages}));
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
                <iris-text path="profile/name" user=${SUGGESTED_FOLLOW} placeholder="Suggested follow"/>
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
            <p>Alternatively, get <a href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}">SMS verified</a> so others can find you.</p>
            <small>${t('no_followers_yet_info')}</small>
          </div>
        </div>
      `;
    }
    return '';
  }

  filter(msg) {
    if (this.state.searchTerm) {
      return msg.text && (msg.text.toLowerCase().indexOf(this.state.searchTerm) > -1);
    }
    return true;
  }

  renderView() {
    return html`
      <div class="centered-container">
        ${this.state.searchTerm ? '' : html`
          <${PublicMessageForm} index=${this.props.index} class="hidden-xs" autofocus=${false}/>
        `}
        <!--<div class="feed-settings">
          <button onClick="${() => {
              State.local.get('show2ndDegreeFollows').put(!this.state.show2ndDegreeFollows);
            }}">
            ${this.state.show2ndDegreeFollows ? 'Hide' : 'Show'} messages from 2nd degree follows
          </button>
        </div>-->
        ${this.state.searchTerm ? html`<h2>Search results for "${this.state.searchTerm}"</h2>` : html`
          ${this.getNotification()}
        `}
        <${MessageFeed} filter=${this.state.searchTerm && (m => this.filter(m))} thumbnails=${this.props.thumbnails} key=${this.props.index || 'feed'} node=${State.local.get(this.props.index || 'feed')} />
      </div>
    `;
  }
}

export default Feed;
