import iris from 'iris-lib';

import { Event } from '../lib/nostr-tools';

import Events from './Events';
import Key from './Key';
import LocalForage from './LocalForage';
import Nostr from './Nostr';

export default {
  profileEventByUser: new Map<string, Event>(),
  followEventByUser: new Map<string, Event>(),
  profiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  knownUsers: new Set<string>(),
  blockedUsers: new Set<string>(),
  flaggedUsers: new Set<string>(),
  setFollowed: function (followedUsers: string | string[], follow = true) {
    if (typeof followedUsers === 'string') {
      followedUsers = [followedUsers];
    }
    const myPub = Key.getPubKey();
    followedUsers.forEach((followedUser) => {
      followedUser = Nostr.toNostrHexAddress(followedUser);
      if (follow && followedUser && followedUser !== myPub) {
        this.addFollower(followedUser, myPub);
      } else {
        this.removeFollower(followedUser, myPub);
      }
    });

    const existing = this.followEventByUser.get(myPub);

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.followedByUser.get(myPub)).map((address: string) => {
        return ['p', address];
      }),
    };

    Events.publish(event);
    Nostr.subscribeToAuthors();
  },

  setBlocked: function (blockedUser: string, block = true) {
    blockedUser = Nostr.toNostrHexAddress(blockedUser);
    const myPub = Key.getPubKey();

    if (block) {
      this.blockedUsers.add(blockedUser);
      this.removeFollower(blockedUser, myPub);
      Events.directMessagesByUser.delete(blockedUser);
    } else {
      this.blockedUsers.delete(blockedUser);
    }
  },

  addFollower: function (followedUser: string, follower: string) {
    if (!this.followersByUser.has(followedUser)) {
      this.followersByUser.set(followedUser, new Set<string>());
    }
    this.knownUsers.add(followedUser);
    this.knownUsers.add(follower);
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<string>());
    }
    const myPub = Key.getPubKey();

    // if new follow, move all their posts to followedByUser
    if (follower === myPub && !this.followedByUser.get(myPub).has(followedUser)) {
      const posts = Events.postsByUser.get(followedUser);
      if (posts) {
        posts.eventIds.forEach((eventId) => {
          const event = Events.cache.get(eventId);
          if (event) {
            const replyingTo = Events.getEventReplyingTo(event);
            if (!replyingTo) {
              Events.latestNotesByFollows.add(event);
            }
            Events.latestNotesAndRepliesByFollows.add(event);
          }
        });
      }
    }
    this.followedByUser.get(follower)?.add(followedUser);
    if (follower === myPub) {
      Nostr.getPostsAndRepliesByUser(followedUser);
    }
    if (followedUser === myPub) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        iris.local().get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myPub)?.has(follower)) {
      if (!Nostr.subscribedUsers.has(followedUser)) {
        Nostr.subscribedUsers.add(followedUser); // subscribe to events from 2nd degree follows
        Nostr.subscribeToAuthors();
      }
    }
  },
  removeFollower: function (unfollowedUser: string, follower: string) {
    this.followersByUser.get(unfollowedUser)?.delete(follower);
    this.followedByUser.get(follower)?.delete(unfollowedUser);
    const blocked = this.blockedUsers.has(unfollowedUser);
    Events.latestNotesByFollows.eventIds.forEach((id) => {
      const fullEvent = Events.cache.get(id);
      if (fullEvent?.pubkey === unfollowedUser) {
        Events.latestNotesByFollows.delete(id);
        // if blocked user is in a p tag, remove the note
        fullEvent?.tags.forEach((tag) => {
          if (tag[0] === 'p' && tag[1] === unfollowedUser) {
            Events.latestNotesByFollows.delete(id);
          }
        });
      }
    });
    if (blocked || this.followersByUser.get(unfollowedUser)?.size === 0) {
      // TODO: remove unfollowedUser from everyone's followersByUser.
      //  if resulting followersByUser(u).size is 0, remove that user as well
      this.followersByUser.delete(unfollowedUser);
      this.knownUsers.delete(unfollowedUser);
      Nostr.subscribedUsers.delete(unfollowedUser);
      Events.latestNotesByEveryone.eventIds.forEach((id) => {
        const fullEvent = Events.cache.get(id);
        if (fullEvent?.pubkey === unfollowedUser) {
          Events.latestNotesByEveryone.delete(id);
          Events.cache.delete(id);
          fullEvent?.tags.forEach((tag) => {
            if (tag[0] === 'p' && tag[1] === unfollowedUser) {
              Events.latestNotesByEveryone.delete(id);
            }
          });
        }
      });
    }
    LocalForage.saveEvents();
  },
  // TODO subscription methods for followersByUser and followedByUser. and maybe messagesByTime. and replies
  followerCount: function (address: string) {
    return this.followersByUser.get(address)?.size ?? 0;
  },
  followedByFriendsCount: function (address: string) {
    let count = 0;
    const myPub = Key.getPubKey();
    for (const follower of this.followersByUser.get(address) ?? []) {
      if (this.followedByUser.get(myPub)?.has(follower)) {
        count++; // should we stop at 10?
      }
    }
    return count;
  },
  block: async function (address: string, isBlocked: boolean) {
    isBlocked ? this.blockedUsers.add(address) : this.blockedUsers.delete(address);
    let content: any = JSON.stringify(Array.from(this.blockedUsers));
    content = await Key.encrypt(content);
    Events.publish({
      kind: 16462,
      content,
    });
  },
  flag: function (address: string, isFlagged: boolean) {
    isFlagged ? this.flaggedUsers.add(address) : this.flaggedUsers.delete(address);
    Events.publish({
      kind: 16463,
      content: JSON.stringify(Array.from(this.flaggedUsers)),
    });
  },
  getBlockedUsers(cb?: (blocked: Set<string>) => void) {
    const callback = () => {
      cb?.(this.blockedUsers);
    };
    callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    Nostr.subscribe([{ kinds: [16462], authors: [myPub] }], callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void) {
    const callback = () => {
      cb?.(this.flaggedUsers);
    };
    callback();
    const myPub = iris.session.getKey()?.secp256k1.rpub;
    Nostr.subscribe([{ kinds: [16463], authors: [myPub] }], callback);
  },
  getFollowedByUser: function (user: string, cb?: (followedUsers: Set<string>) => void) {
    const callback = () => {
      cb?.(this.followedByUser.get(user) ?? new Set());
    };
    this.followedByUser.has(user) && callback();
    Nostr.subscribe([{ kinds: [3], authors: [user] }], callback);
  },
  getFollowersByUser: function (address: string, cb?: (followers: Set<string>) => void) {
    const callback = () => {
      cb?.(this.followersByUser.get(address) ?? new Set());
    };
    this.followersByUser.has(address) && callback();
    Nostr.subscribe([{ kinds: [3], '#p': [address] }], callback); // TODO this doesn't fire when a user is unfollowed
  },
  getProfile(address, cb?: (profile: any, address: string) => void, verifyNip05 = false) {
    this.knownUsers.add(address);
    const callback = () => {
      cb?.(this.profiles.get(address), address);
    };

    const profile = this.profiles.get(address);
    if (profile) {
      callback();
      if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
        Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
          console.log('NIP05 address is valid?', isValid, profile.nip05, address);
          profile.nip05valid = isValid;
          this.profiles.set(address, profile);
          callback();
        });
      }
    } else if (!Nostr.subscribedProfiles.has(address)) {
      fetch(`https://api.iris.to/profile/${address}`).then((res) => {
        if (res.status === 200) {
          res.json().then((profile) => {
            Events.handle(profile);
          });
        }
      });
    }

    Nostr.subscribedProfiles.add(address);
    Nostr.subscribe([{ authors: [address], kinds: [0, 3] }], callback);
  },
};
