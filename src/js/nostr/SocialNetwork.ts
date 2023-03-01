import { Event } from '../lib/nostr-tools';
import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import LocalForage from './LocalForage';
import Subscriptions, { Unsubscribe } from './Subscriptions';

export default {
  SUGGESTED_FOLLOWS: [
    'npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9', // snowden
    'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m', // jack
    'npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a', // Lyn Alden
    'npub15dqlghlewk84wz3pkqqvzl2w2w36f97g89ljds8x6c094nlu02vqjllm5m', // saylor
    'npub1g53mukxnjkcmr94fhryzkqutdz2ukq4ks0gvy5af25rgmwsl4ngq43drvk', // sirius
    'npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p', // yegorpetrov
    'npub1az9xj85cmxv8e9j9y80lvqp97crsqdu2fpu3srwthd99qfu9qsgstam8y8', // nvk
    'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6', // fiatjaf
    'npub1xtscya34g58tk0z605fvr788k263gsu6cy9x0mhnm87echrgufzsevkk5s', // jb55
  ],
  followDistanceByUser: new Map<string, number>(),
  profileEventByUser: new Map<string, Event>(),
  followEventByUser: new Map<string, Event>(),
  profiles: new Map<string, any>(),
  followedByUser: new Map<string, Set<string>>(),
  followersByUser: new Map<string, Set<string>>(),
  blockedUsers: new Set<string>(),
  flaggedUsers: new Set<string>(),
  setFollowed: function (followedUsers: string | string[], follow = true) {
    if (typeof followedUsers === 'string') {
      followedUsers = [followedUsers];
    }
    const myPub = Key.getPubKey();
    followedUsers.forEach((followedUser) => {
      followedUser = Key.toNostrHexAddress(followedUser);
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
    Subscriptions.subscribeToAuthors();
  },

  setBlocked: function (blockedUser: string, block = true) {
    blockedUser = Key.toNostrHexAddress(blockedUser);
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
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<string>());
    }
    const myPub = Key.getPubKey();

    if (follower === myPub) {
      // basically same as the next "else" block, but faster
      this.followDistanceByUser.set(followedUser, 1);
    } else {
      const existingFollowDistance = this.followDistanceByUser.get(followedUser);
      const followerDistance = this.followDistanceByUser.get(follower);
      const newFollowDistance = followerDistance && followerDistance + 1;
      if (!existingFollowDistance || newFollowDistance < existingFollowDistance) {
        this.followDistanceByUser.set(followedUser, newFollowDistance);
      }
    }

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
      Events.getPostsAndRepliesByUser(followedUser);
    }
    if (followedUser === myPub) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        localState.get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myPub)?.has(follower)) {
      if (!Subscriptions.subscribedUsers.has(followedUser)) {
        Subscriptions.subscribedUsers.add(followedUser); // subscribe to events from 2nd degree follows
        Subscriptions.subscribeToAuthors();
      }
    }
  },
  removeFollower: function (unfollowedUser: string, follower: string) {
    this.followersByUser.get(unfollowedUser)?.delete(follower);
    this.followedByUser.get(follower)?.delete(unfollowedUser);

    // iterate over remaining followers and set the smallest follow distance
    let smallest = 1000;
    for (const follower of this.followersByUser.get(unfollowedUser) || []) {
      const distance = this.followDistanceByUser.get(follower) + 1;
      if (distance && distance < smallest) {
        smallest = distance;
      }
    }

    if (smallest === 1000) {
      this.followDistanceByUser.delete(unfollowedUser);
    } else {
      this.followDistanceByUser.set(unfollowedUser, smallest);
    }

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
      // TODO: remove from all indexes. something like lokijs could help in index management.
      //  if resulting followersByUser(u).size is 0, remove that user as well
      this.followDistanceByUser.delete(unfollowedUser);
      this.followersByUser.delete(unfollowedUser);
      Subscriptions.subscribedUsers.delete(unfollowedUser);
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
  getBlockedUsers(cb?: (blocked: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.blockedUsers);
    };
    callback();
    const myPub = Key.getPubKey();
    return Subscriptions.subscribe([{ kinds: [16462], authors: [myPub] }], callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.flaggedUsers);
    };
    callback();
    const myPub = Key.getPubKey();
    return Subscriptions.subscribe([{ kinds: [16463], authors: [myPub] }], callback);
  },
  getFollowedByUser: function (
    user: string,
    cb?: (followedUsers: Set<string>) => void,
  ): Unsubscribe {
    const callback = () => {
      cb?.(this.followedByUser.get(user) ?? new Set());
    };
    this.followedByUser.has(user) && callback();
    return Subscriptions.subscribe([{ kinds: [3], authors: [user] }], callback);
  },
  getFollowersByUser: function (
    address: string,
    cb?: (followers: Set<string>) => void,
  ): Unsubscribe {
    const callback = () => {
      cb?.(this.followersByUser.get(address) ?? new Set());
    };
    this.followersByUser.has(address) && callback();
    return Subscriptions.subscribe([{ kinds: [3], '#p': [address] }], callback); // TODO this doesn't fire when a user is unfollowed
  },
  // TODO param "proxyFirst" to skip relays if http proxy responds quickly
  getProfile(
    address,
    cb?: (profile: any, address: string) => void,
    verifyNip05 = false,
  ): Unsubscribe {
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
    } else if (!Subscriptions.subscribedProfiles.has(address)) {
      fetch(`https://api.iris.to/profile/${address}`).then((res) => {
        if (res.status === 200) {
          res.json().then((profile) => {
            // TODO verify sig
            Events.handle(profile);
          });
        }
      });
    }
    Subscriptions.subscribedProfiles.add(address);
    return Subscriptions.subscribe([{ authors: [address], kinds: [0, 3] }], callback);
  },
  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    Events.publish(event);
  },
};
