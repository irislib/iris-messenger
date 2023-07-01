import throttle from 'lodash/throttle';

import { PrimaryButton as Button } from '../components/buttons/Button';
import Follow from '../components/buttons/Follow';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import localState from '../LocalState';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';

class Follows extends View {
  follows: Set<string>;
  myPub: string | null;

  constructor() {
    super();
    this.myPub = null;
    this.follows = new Set();
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
    const hex = Key.toNostrHexAddress(this.props.id) || '';
    hex &&
      SocialNetwork.getFollowedByUser(hex, (follows) => {
        this.follows = follows; // TODO buggy?
        this.updateSortedFollows();
      });
  }

  shouldComponentUpdate() {
    return true;
  }

  getFollowers() {
    const hex = Key.toNostrHexAddress(this.props.id) || '';
    hex &&
      SocialNetwork.getFollowersByUser(hex, (followers) => {
        this.follows = followers;
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
    return this.state.follows.map((hexKey) => {
      const npub = Key.toNostrBech32Address(hexKey, 'npub') || '';
      return (
        <div key={npub} className="flex w-full">
          <a href={`/${npub}`} className="flex flex-1 gap-2">
            <Identicon str={npub} width={49} />
            <div>
              <Name pub={npub} />
              <br />
              <span className="text-neutral-500 text-sm">
                {SocialNetwork.followersByUser.get(hexKey)?.size || 0}
                <i> </i>
                followers
              </span>
            </div>
          </a>
          {hexKey !== Key.getPubKey() && <Follow id={npub} />}
        </div>
      );
    });
  }

  renderView() {
    const showFollowAll =
      this.state.follows.length > 1 && !(this.props.id === this.myPub && !this.props.followers);
    return (
      <>
        <div className="flex justify-between mb-4">
          <span className="text-2xl font-bold">
            <a className="link" href={`/${this.props.id}`}>
              <Name pub={this.props.id} />
            </a>
            :<i> </i>
            <span style={{ flex: 1 }} className="ml-1">
              {this.props.followers ? t('followers') : t('following')}
            </span>
          </span>
          {showFollowAll ? (
            <span style="text-align: right" className="hidden md:inline">
              <button className="btn btn-sm btn-neutral" onClick={() => this.followAll()}>
                {t('follow_all')} ({this.state.follows.length})
              </button>
            </span>
          ) : (
            ''
          )}
        </div>
        {showFollowAll ? (
          <p style="text-align: right" className="inline md:hidden">
            <button className="btn btn-sm btn-neutral" onClick={() => this.followAll()}>
              {t('follow_all')} ({this.state.follows.length})
            </button>
          </p>
        ) : (
          ''
        )}
        <div className="flex flex-col w-full gap-4">
          {this.renderFollows() /* TODO limit if lots of follows */}
          {this.state.follows.length === 0 ? '—' : ''}
        </div>
      </>
    );
  }
}

export default Follows;
