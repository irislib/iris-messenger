import { sha256 } from '@noble/hashes/sha256';
import { debounce, throttle } from 'lodash';

import Helpers from '../Helpers';
import { Event, Filter, Relay, Sub } from '../lib/nostr-tools';

import Events from './Events';
import Key from './Key';
import Nostr from './Nostr';
import Relays from './Relays';
import SocialNetwork from './SocialNetwork';

type Subscription = {
  filters: Filter[];
  callback?: (event: Event) => void;
};

let subscriptionId = 0;

const Subscriptions = {
  subscriptionsByName: new Map<string, Set<Sub>>(),
  subscribedFiltersByName: new Map<string, Filter[]>(),
  subscriptions: new Map<number, Subscription>(),
  subscribedUsers: new Set<string>(),
  subscribedPosts: new Set<string>(),
  subscribedRepliesAndLikes: new Set<string>(),
  subscribedProfiles: new Set<string>(),
  subscribedKeywords: new Set<string>(),
  getSubscriptionIdForName(name: string) {
    return Helpers.arrayToHex(sha256(name)).slice(0, 8);
  },
  resubscribe(relay: Relay) {
    for (const [name, filters] of this.subscribedFiltersByName.entries()) {
      const id = this.getSubscriptionIdForName(name);
      const sub = relay.sub(filters, { id });
      if (!this.subscriptionsByName.has(name)) {
        this.subscriptionsByName.set(name, new Set());
      }
      this.subscriptionsByName.get(name)?.add(sub);
    }
  },
  sendSubToRelays: function (filters: Filter[], id: string, once = false, unsubscribeTimeout = 0) {
    // if subs with same id already exists, remove them
    if (id) {
      const subs = this.subscriptionsByName.get(id);
      if (subs) {
        subs.forEach((sub) => {
          //console.log('unsub', id);
          sub.unsub();
        });
      }
      this.subscriptionsByName.delete(id);
      this.subscribedFiltersByName.delete(id);
    }

    this.subscribedFiltersByName.set(id, filters);

    if (unsubscribeTimeout) {
      setTimeout(() => {
        this.subscriptionsByName.delete(id);
        this.subscribedFiltersByName.delete(id);
      }, unsubscribeTimeout);
    }

    for (const relay of (id == 'keywords' ? Relays.searchRelays : Relays.relays).values()) {
      const subId = this.getSubscriptionIdForName(id);
      const sub = relay.sub(filters, { id: subId });
      // TODO update relay lastSeen
      sub.on('event', (event) => Events.handle(event));
      if (once) {
        sub.on('eose', () => sub.unsub());
      }
      if (!this.subscriptionsByName.has(id)) {
        this.subscriptionsByName.set(id, new Set());
      }
      this.subscriptionsByName.get(id)?.add(sub);
      //console.log('subscriptions size', this.subscriptionsByName.size);
      if (unsubscribeTimeout) {
        setTimeout(() => {
          sub.unsub();
        }, unsubscribeTimeout);
      }
    }
  },
  subscribeToRepliesAndLikes: debounce(() => {
    console.log('subscribeToRepliesAndLikes', Subscriptions.subscribedRepliesAndLikes);
    Subscriptions.sendSubToRelays(
      [{ kinds: [1, 6, 7], '#e': Array.from(Subscriptions.subscribedRepliesAndLikes.values()) }],
      'subscribedRepliesAndLikes',
      true,
    );
  }, 500),
  // TODO we shouldn't bang the history queries all the time. only ask a users history once per relay.
  // then we can increase the limit
  subscribeToAuthors: debounce(() => {
    const now = Math.floor(Date.now() / 1000);
    const myPub = Key.getPubKey();
    const followedUsers = Array.from(SocialNetwork.followedByUser.get(myPub) ?? []);
    followedUsers.push(myPub);
    console.log('subscribe to', followedUsers.length, 'followedUsers');
    Subscriptions.sendSubToRelays(
      [{ kinds: [0, 3], until: now, authors: followedUsers }],
      'followed',
      true,
    );
    if (Subscriptions.subscribedProfiles.size) {
      Subscriptions.sendSubToRelays(
        [{ authors: Array.from(Subscriptions.subscribedProfiles.values()), kinds: [0] }],
        'subscribedProfiles',
        true,
      );
    }
    setTimeout(() => {
      Subscriptions.sendSubToRelays(
        [{ authors: followedUsers, limit: 500, until: now }],
        'followedHistory',
        true,
      );
    }, 1000);
  }, 1000),
  subscribeToPosts: throttle(
    () => {
      if (Subscriptions.subscribedPosts.size === 0) return;
      console.log('subscribe to', Subscriptions.subscribedPosts.size, 'posts');
      Subscriptions.sendSubToRelays(
        [{ ids: Array.from(Subscriptions.subscribedPosts).slice(0, 1000) }],
        'posts',
      );
    },
    3000,
    { leading: false },
  ),
  subscribeToKeywords: debounce(() => {
    if (Subscriptions.subscribedKeywords.size === 0) return;
    console.log(
      'subscribe to keywords',
      Array.from(Subscriptions.subscribedKeywords),
      SocialNetwork.knownUsers.size,
    );
    const go = () => {
      Subscriptions.sendSubToRelays(
        [
          {
            kinds: [1],
            limit: Nostr.MAX_MSGS_BY_KEYWORD,
            keywords: Array.from(Subscriptions.subscribedKeywords),
          },
        ],
        'keywords',
      );
      // on page reload knownUsers are empty and thus all search results are dropped
      if (SocialNetwork.knownUsers.size < 1000) setTimeout(go, 2000);
    };
    go();
  }, 100),
  unsubscribe: function (id: string) {
    const subs = this.subscriptionsByName.get(id);
    if (subs) {
      subs.forEach((sub) => {
        console.log('unsub', id);
        sub.unsub();
      });
    }
    this.subscriptionsByName.delete(id);
    this.subscribedFiltersByName.delete(id);
  },
  subscribe: function (filters: Filter[], cb?: (event: Event) => void) {
    cb &&
      this.subscriptions.set(subscriptionId++, {
        filters,
        callback: cb,
      });

    let hasNewAuthors = false;
    let hasNewIds = false;
    let hasNewReplyAndLikeSubs = false;
    let hasNewKeywords = false;
    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          if (!author) continue;
          // make sure the author is valid hex
          if (!author.match(/^[0-9a-fA-F]{64}$/)) {
            console.error('Invalid author', author);
            continue;
          }
          if (!this.subscribedUsers.has(author)) {
            hasNewAuthors = true;
            this.subscribedUsers.add(author);
          }
        }
      }
      if (filter.ids) {
        for (const id of filter.ids) {
          if (!this.subscribedPosts.has(id)) {
            hasNewIds = true;
            this.subscribedPosts.add(Nostr.toNostrHexAddress(id));
          }
        }
      }
      if (Array.isArray(filter['#e'])) {
        for (const id of filter['#e']) {
          if (!this.subscribedRepliesAndLikes.has(id)) {
            hasNewReplyAndLikeSubs = true;
            this.subscribedRepliesAndLikes.add(id);
            setTimeout(() => {
              // remove after some time, so the requests don't grow too large
              this.subscribedRepliesAndLikes.delete(id);
            }, 60 * 1000);
          }
        }
      }
      if (filter.keywords) {
        for (const keyword of filter.keywords) {
          if (!this.subscribedKeywords.has(keyword)) {
            hasNewKeywords = true;
            // only 1 keyword at a time, otherwise a popular kw will consume the whole 'limit'
            this.subscribedKeywords.clear();
            this.subscribedKeywords.add(keyword);
          }
        }
      }
    }
    hasNewReplyAndLikeSubs && this.subscribeToRepliesAndLikes(this);
    hasNewAuthors && this.subscribeToAuthors(this); // TODO subscribe to old stuff from new authors, don't resubscribe to all
    hasNewIds && this.subscribeToPosts(this);
    hasNewKeywords && this.subscribeToKeywords(this);
  },
};

export default Subscriptions;
