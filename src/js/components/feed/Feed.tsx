import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import { ID, PUB } from '../../nostr/UserIds';

import BaseFeed from './BaseFeed';

const TIMESPANS = {
  all: 0,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  year: 365 * 24 * 60 * 60,
};

class Feed extends BaseFeed {
  addSinceUntil(filter) {
    const since = this.getSince();
    const until = this.oldestEventCreatedAt();
    if (since) {
      filter.since = since;
    }
    if (until) {
      filter.until = until;
    }
    return filter;
  }

  getSince() {
    if (this.state.settings.timespan !== 'all') {
      return Math.floor(Date.now() / 1000) - TIMESPANS[this.state.settings.timespan];
    }
  }

  getCallbackForPostsIndex(callback) {
    return (event) => {
      if (
        this.props.index === 'posts' &&
        Events.getEventReplyingTo(event) &&
        !Events.isRepost(event)
      ) {
        return;
      }
      callback(event);
    };
  }

  subscribeToNostrUser(callback) {
    let filter = {
      authors: [this.props.nostrUser || ''],
      kinds: [1, 6],
    };
    filter = this.addSinceUntil(filter);

    console.log('subscribing to nostr user', this.props.nostrUser, filter);

    if (this.props.index === 'likes') {
      filter.kinds = [7];
      return PubSub.subscribe(filter, callback, false, false);
    } else {
      return PubSub.subscribe(filter, this.getCallbackForPostsIndex(callback), false, false);
    }
  }

  subscribeToKeyword(callback) {
    let filter = {
      // Filter type doesn't have "keywords"...
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      keywords: [this.props.keyword.toLowerCase()],
      kinds: [1],
      limit: 1000,
    };
    filter = this.addSinceUntil(filter);

    return PubSub.subscribe(
      filter,
      (e) => e.content?.toLowerCase().includes(this.props.keyword.toLowerCase()) && callback(e),
      false,
    );
  }

  subscribeToFollows(callback) {
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(ID(myPub)) || []).map(
      (user) => PUB(user),
    );
    followedUsers.push(myPub);

    let filter = {
      kinds: [1, 6],
      limit: 300,
    } as any;

    if (followedUsers.length < 1000) {
      filter.authors = followedUsers;
    }
    filter = this.addSinceUntil(filter);

    return PubSub.subscribe(
      filter,
      (e) => {
        if (e.pubkey === myPub || SocialNetwork.isFollowing(myPub, e.pubkey)) {
          callback(e);
        }
      },
      true,
    );
  }

  subscribeToGlobalFeed(callback) {
    let filter = { kinds: [1, 6], limit: 300 };
    filter = this.addSinceUntil(filter);
    return PubSub.subscribe(filter, callback, true);
  }

  getEvents(callback) {
    if (this.props.nostrUser) {
      return this.subscribeToNostrUser(callback);
    } else if (this.props.keyword) {
      return this.subscribeToKeyword(callback);
    } else if (this.props.index === 'follows') {
      return this.subscribeToFollows(callback);
    } else {
      return this.subscribeToGlobalFeed(callback);
    }
  }
}

export default Feed;
