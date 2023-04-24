import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';

import BaseFeed from './BaseFeed';

const TIMESPANS = {
  all: 0,
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  year: 365 * 24 * 60 * 60,
};

class Feed extends BaseFeed {
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

  subscribeToNostrUser(since, callback) {
    if (this.props.index === 'likes') {
      return PubSub.subscribe(
        { authors: [this.props.nostrUser], kinds: [7], since },
        callback,
        false,
        false,
      );
    } else {
      return PubSub.subscribe(
        { authors: [this.props.nostrUser], kinds: [1, 6], since },
        this.getCallbackForPostsIndex(callback),
        false,
        false,
      );
    }
  }

  subscribeToKeyword(since, callback) {
    const keyword = this.props.keyword.toLowerCase();
    return PubSub.subscribe(
      { keywords: [keyword], kinds: [1], limit: 1000, since },
      (e) => e.content?.toLowerCase().includes(keyword) && callback(e),
      false,
    );
  }

  subscribeToFollows(since, callback) {
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) || []);
    followedUsers.push(myPub);
    const filter = { kinds: [1, 6], limit: 300, since, authors: undefined };
    if (followedUsers.length < 1000) {
      filter.authors = followedUsers;
    }
    return PubSub.subscribe(
      filter,
      (e) => {
        if (e.pubkey === myPub || SocialNetwork.followedByUser.get(myPub)?.has(e.pubkey)) {
          callback(e);
        }
      },
      true,
    );
  }

  subscribeToGlobalFeed(since, callback) {
    return PubSub.subscribe({ kinds: [1, 6], limit: 300, since }, callback, true);
  }

  getEvents(callback) {
    const since = this.getSince();

    if (this.props.nostrUser) {
      return this.subscribeToNostrUser(since, callback);
    } else if (this.props.keyword) {
      return this.subscribeToKeyword(since, callback);
    } else if (this.props.index === 'follows') {
      return this.subscribeToFollows(since, callback);
    } else {
      return this.subscribeToGlobalFeed(since, callback);
    }
  }
}

export default Feed;
