import Helpers, { html } from '../Helpers.js';
import State from '../State.js';
import PublicMessageForm from '../components/PublicMessageForm.js';
import Identicon from '../components/Identicon.js';
import FollowButton from '../components/FollowButton.js';
import CopyButton from '../components/CopyButton.js';
import MessageFeed from '../components/MessageFeed.js';
import Filters from '../components/Filters.js';
import Session from '../Session.js';
import View from './View.js';
import {translate as t} from '../Translation.js';

const SUGGESTED_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';

class Feed extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = {sortedMessages: [], group: "follows"};
    this.messages = {};
    this.id = 'message-view';
    this.class = 'public-messages-view';
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
    State.local.get('filters').get('group').on(group => this.setState({group}));
    State.local.get('noFollows').on(noFollows => this.setState({noFollows}));
    State.local.get('noFollowers').on(noFollowers => this.setState({noFollowers}));
  }

  componentWillUnmount() {
    Object.values(this.eventListeners).forEach(e => e.off());
  }

  getNotification() {
    if (this.state.noFollows) {
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
            <p dangerouslySetInnerHTML=${{
                __html: t(
                  'alternatively_get_sms_verified',
                  `href="https://iris-sms-auth.herokuapp.com/?pub=${Session.getPubKey()}"`
                )}}>
            </p>
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
    const s = this.state;
    return html`
      <div class="centered-container">
        ${s.searchTerm ? '' : html`
          <${PublicMessageForm} index=${this.props.index} class="hidden-xs" autofocus=${false}/>
        `}
        ${s.searchTerm ? html`<h2>Search results for "${s.searchTerm}"</h2>` : html`
          ${this.getNotification()}
        `}
        ${s.noFollows ? '' : html`<${Filters}/>`}
        <${MessageFeed} scrollElement=${this.scrollElement.current} filter=${s.searchTerm && (m => this.filter(m))} thumbnails=${this.props.thumbnails} key=${this.props.index || 'feed'} group=${this.state.group} path=${this.props.index || 'msgs'} />
      </div>
    `;
  }
}

export default Feed;
