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
  getEvents(callback) {
    // different feeds should perhaps be in different components?
    let since;
    if (this.state.settings.timespan !== 'all') {
      since = Math.floor(Date.now() / 1000) - TIMESPANS[this.state.settings.timespan];
    }
    if (this.props.nostrUser) {
      if (this.props.index === 'likes') {
        return PubSub.subscribe(
          // TODO map to liked msg id
          { authors: [this.props.nostrUser], kinds: [7], since },
          callback,
          false,
          false,
        );
      } else {
        return PubSub.subscribe(
          { authors: [this.props.nostrUser], kinds: [1, 6], since },
          (event) => {
            if (this.props.index === 'posts') {
              if (Events.getEventReplyingTo(event) && !Events.isRepost(event)) {
                return;
              }
            }
            callback(event);
          },
          false,
          false,
        );
      }
    } else if (this.props.keyword) {
      const keyword = this.props.keyword.toLowerCase();
      return PubSub.subscribe(
        { keywords: [keyword], kinds: [1], limit: 1000, since },
        (e) => e.content?.toLowerCase().includes(keyword) && callback(e), // TODO this should not be necessary. seems subscribe still asks non-search relays
        false,
      );
    } else if (this.props.index === 'follows') {
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
    return PubSub.subscribe({ kinds: [1, 6], limit: 300, since }, callback, true);
  }
}

export default Feed;
