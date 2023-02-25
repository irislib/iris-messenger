import { html } from 'htm/preact';
import iris from 'iris-lib';
import throttle from 'lodash/throttle';

import Button from '../components/basic/Button';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import Key from '../nostr/Key';
import Nostr from '../nostr/Nostr';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import View from './View';

class Follows extends View {
  constructor() {
    super();
    this.follows = [];
    this.id = 'follows-view';
    this.state = { follows: [], contacts: {} };
  }

  updateSortedFollows = throttle(
    () => {
      const follows = Array.from(this.follows).sort((aK, bK) => {
        const aName = SocialNetwork.profiles.get(aK)?.name;
        const bName = SocialNetwork.profiles.get(bK)?.name;
        if (!aName && !bName) {
          return aK.localeCompare(bK);
        }
        if (!aName) {
          return 1;
        }
        if (!bName) {
          return -1;
        }
        return aName.localeCompare(bName);
      });
      this.setState({ follows });
    },
    1000,
    { leading: true },
  );

  getFollows() {
    SocialNetwork.getFollowedByUser(Nostr.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows; // TODO buggy?
      this.updateSortedFollows();
    });
  }

  shouldComponentUpdate() {
    return true;
  }

  getFollowers() {
    SocialNetwork.getFollowersByUser(Nostr.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows;
      this.updateSortedFollows();
    });
  }

  componentDidMount() {
    if (this.props.id) {
      this.myPub = Nostr.toNostrBech32Address(Key.getPubKey(), 'npub');
      this.props.followers ? this.getFollowers() : this.getFollows();
      iris.local().get('contacts').on(this.inject());
    }
  }

  followAll() {
    confirm(`${t('follow_all')} (${this.state.follows.length})?`) &&
      SocialNetwork.setFollowed(this.state.follows);
  }

  renderView() {
    return html`
      <div class="centered-container">
        <h3 style="display:flex">
          <a href="/${this.props.id}"> <${Name} pub=${this.props.id} /> </a>:<i> </i>

          <span style="flex:1" class="mar-left5">
            ${this.props.followers ? t('followers') : t('following')}
          </span>

          ${this.state.follows.length > 1 &&
          !(this.props.id === this.myPub && !this.props.followers)
            ? html`
                <${Button} small=${true} onClick=${() => this.followAll()}>
                  ${t('follow_all')} (${this.state.follows.length})
                <//>
              `
            : ''}
        </h3>
        <div id="follows-list">
          ${this.state.follows.map((hexKey) => {
            const npub = Nostr.toNostrBech32Address(hexKey, 'npub');
            return html` <div key=${npub} class="profile-link-container">
              <a href="/${npub}" class="profile-link">
                <${Identicon} str=${npub} width="49" />
                <div>
                  <${Name} pub=${npub} /><br />
                  <small class="follower-count">
                    ${SocialNetwork.followersByUser.get(hexKey)?.size || 0}<i> </i> followers
                  </small>
                </div>
              </a>
              ${hexKey !== Key.getPubKey() ? html`<${FollowButton} id=${npub} />` : ''}
            </div>`;
          })}
          ${this.state.follows.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
