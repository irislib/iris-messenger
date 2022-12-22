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
    this.follows = new Set();
    this.followNames = new Map();
    this.id = 'follows-view';
    this.state = { follows: [], contacts: {} };
  }

  updateSortedFollows = throttle(
    () => {
      const follows = Array.from(this.follows).sort((aK, bK) => {
        const aName = this.followNames.get(aK);
        const bName = this.followNames.get(bK);
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
    const nostrAddress = Nostr.toNostrHexAddress(this.props.id);

    if (nostrAddress) {
      this.follows = Nostr.followedByUser.get(nostrAddress) ?? new Set();
      this.updateSortedFollows();
    } else {
      iris
        .public(this.props.id)
        .get('follow')
        .map()
        .on(
          this.sub((follows, pub) => {
            if (follows && !this.follows.has(pub)) {
              this.follows.add(pub);
              this.getNameForUser(pub);
            }
            this.updateSortedFollows();
          }),
        );
    }
  }

  shouldComponentUpdate() {
    return true;
  }

  getNameForUser(user) {
    // TODO get from nostr
    iris
      .public(user)
      .get('profile')
      .get('name')
      .on(
        this.sub((name) => {
          if (!name) return;
          this.followNames.set(user, name);
          this.updateSortedFollows();
        }),
      );
  }

  getFollowers() {
    const nostrAddress = Nostr.toNostrHexAddress(this.props.id);

    if (nostrAddress) {
      this.follows = Nostr.followersByUser.get(nostrAddress) ?? new Set();
      this.updateSortedFollows();
    } else {
      iris.group().on(
        `follow/${this.props.id}`,
        this.sub((following, a, b, e, user) => {
          if (following && !this.follows.has(user)) {
            if (!following) return;
            this.follows.add(user);
            this.getNameForUser(user);
            this.updateSortedFollows();
          }
        }),
      );
    }
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
          ${this.state.follows.map((k) => {
            return html` <div key=${k} class="profile-link-container">
              <a href="/profile/${k}" class="profile-link">
                <${Identicon} str=${k} width="49" />
                <div>
                  <${Name} pub=${k} /><br />
                  <small class="follower-count"
                    >${(this.state.contacts[k] && this.state.contacts[k].followerCount) || 0}<i
                    > </i> followers</small
                  >
                </div>
              </a>
              ${k !== iris.session.getPubKey() ? html`<${FollowButton} id=${k} />` : ''}
            </div>`;
          })}
          ${this.state.follows.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Follows;
