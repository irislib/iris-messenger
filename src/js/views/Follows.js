import { html } from 'htm/preact';
import iris from 'iris-lib';
import throttle from 'lodash/throttle';

import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import Nostr from '../Nostr';
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
        const aName = Nostr.profiles.get(aK)?.name;
        const bName = Nostr.profiles.get(bK)?.name;
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
    Nostr.getFollowedByUser(Nostr.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows; // TODO buggy?
      this.updateSortedFollows();
    });
  }

  shouldComponentUpdate() {
    return true;
  }

  getFollowers() {
    Nostr.getFollowersByUser(Nostr.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows;
      this.updateSortedFollows();
    });
  }

  componentDidMount() {
    if (this.props.id) {
      this.props.followers ? this.getFollowers() : this.getFollows();
      iris.local().get('contacts').on(this.inject());
    }
  }

  renderView() {
    return html`
      <div class="centered-container">
        <h3>
          <a href="/profile/${this.props.id}"> <${Name} pub=${this.props.id} /> </a>:<i> </i> ${this
            .props.followers
            ? t('followers')
            : t('following')}
        </h3>
        <div id="follows-list">
          ${this.state.follows.map((hexKey) => {
            const npub = Nostr.toNostrBech32Address(hexKey, 'npub');
            return html` <div key=${npub} class="profile-link-container">
              <a href="/profile/${npub}" class="profile-link">
                <${Identicon} str=${npub} width="49" />
                <div>
                  <${Name} pub=${npub} /><br />
                  <small class="follower-count">
                    ${Nostr.followersByUser.get(hexKey)?.size || 0}<i> </i> followers
                  </small>
                </div>
              </a>
              ${hexKey !== iris.session.getKey().secp256k1.rpub
                ? html`<${FollowButton} id=${npub} />`
                : ''}
            </div>`;
          })}
          ${this.state.follows.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
