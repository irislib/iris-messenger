import { html } from 'htm/preact';
import State from '../../../iris-lib/src/State';
import Identicon from '../components/Identicon';
import {translate as t} from '../translations/Translation';
import FollowButton from '../components/FollowButton';
import Name from '../components/Name';
import View from './View';
import Session from 'iris-lib/src/Session';
import {throttle} from 'lodash';

class Follows extends View {
  constructor() {
    super();
    this.follows = new Set();
    this.followNames = new Map();
    this.id = "follows-view";
    this.state = { follows: [], contacts: {} };
  }

  updateSortedFollows = throttle(() => {
    const follows = Array.from(this.follows).sort((aK,bK) => {
      const aName = this.followNames.get(aK);
      const bName = this.followNames.get(bK);
      if (!aName && !bName) { return aK.localeCompare(bK); }
      if (!aName) { return 1; }
      if (!bName) { return -1; }
      return aName.localeCompare(bName);
    });
    this.setState({follows});
  }, 1000, {leading: false});

  getFollows() {
    State.public.user(this.props.id).get('follow').map().on(this.sub(
      (follows, pub) => {
        if (follows && !this.follows.has(pub)) {
          this.follows.add(pub);
          this.getNameForUser(pub);
        }
        this.updateSortedFollows();
      }));
  }

  shouldComponentUpdate() {
    return true;
  }

  getNameForUser(user) {
    State.public.user(user).get('profile').get('name').on(this.sub(name => {
      if (!name) return;
      this.followNames.set(user, name);
      this.updateSortedFollows();
    }));
  }

  getFollowers() {
    State.group().on(`follow/${this.props.id}`, this.sub((following, a, b, e, user) => {
      if (following && !this.follows.has(user)) {
          if (!following) return;
          this.follows.add(user);
          this.getNameForUser(user);
          this.updateSortedFollows();
      }
    }));
  }

  componentDidMount() {
    if (this.props.id) {
      this.props.followers ? this.getFollowers() : this.getFollows();
      State.local.get('contacts').on(this.inject());
    }
  }

  renderView() {
    return html`
      <div class="centered-container">
        <h3><a href="/profile/${this.props.id}"><${Name} pub=${this.props.id} placeholder="—" /></a>:<i> </i>
        ${this.props.followers ? t('followers') : t('following')}</h3>
        <div id="follows-list">
          ${this.state.follows.map(k => {
            return html`
            <div key=${k} class="profile-link-container">
              <a href="/profile/${k}" class="profile-link">
                <${Identicon} str=${k} width=49/>
                <div>
                  <${Name} pub=${k}/><br/>
                  <small class="follower-count">${this.state.contacts[k] && this.state.contacts[k].followerCount} followers</small>
                </div>
              </a>
              ${k !== Session.getPubKey() ? html`<${FollowButton} id=${k}/>` : ''}

            </div>`;
          })}
          ${this.state.follows.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
