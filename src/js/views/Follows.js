import { html } from 'htm/preact';
import throttle from 'lodash/throttle';
import ScrollViewport from 'preact-scroll-viewport';

import { PrimaryButton as Button } from '../components/buttons/Button';
import Follow from '../components/buttons/Follow';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import localState from '../LocalState';
import Key from '../nostr/Key';
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

  sortByName(aK, bK) {
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
  }

  sortByFollowDistance(aK, bK) {
    const aDistance = SocialNetwork.followDistanceByUser.get(aK);
    const bDistance = SocialNetwork.followDistanceByUser.get(bK);
    if (aDistance === bDistance) {
      return this.sortByName(aK, bK);
    }
    if (!aDistance) {
      return 1;
    }
    if (!bDistance) {
      return -1;
    }
    return aDistance - bDistance;
  }

  updateSortedFollows = throttle(
    () => {
      const comparator = (a, b) =>
        this.props.followers ? this.sortByFollowDistance(a, b) : this.sortByName(a, b);
      const follows = Array.from(this.follows).sort(comparator);
      this.setState({ follows });
    },
    1000,
    { leading: true },
  );

  getFollows() {
    SocialNetwork.getFollowedByUser(Key.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows; // TODO buggy?
      this.updateSortedFollows();
    });
  }

  shouldComponentUpdate() {
    return true;
  }

  getFollowers() {
    SocialNetwork.getFollowersByUser(Key.toNostrHexAddress(this.props.id), (follows) => {
      this.follows = follows;
      this.updateSortedFollows();
    });
  }

  componentDidMount() {
    if (this.props.id) {
      this.myPub = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
      this.props.followers ? this.getFollowers() : this.getFollows();
      localState.get('contacts').on(this.inject());
    }
  }

  followAll() {
    confirm(`${t('follow_all')} (${this.state.follows.length})?`) &&
      SocialNetwork.setFollowed(this.state.follows);
  }

  renderFollows() {
    return html`
      ${this.state.follows.map((hexKey) => {
        const npub = Key.toNostrBech32Address(hexKey, 'npub');
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
          ${hexKey !== Key.getPubKey() ? html`<${Follow} id=${npub} />` : ''}
        </div>`;
      })}
    `;
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
          ${this.state.follows.length > 300
            ? html`<${ScrollViewport}>${this.renderFollows()}<//>`
            : this.renderFollows()}
          ${this.state.follows.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
