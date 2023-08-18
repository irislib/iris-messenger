import EventDB from '@/nostr/EventDB.ts';

import localState from '../LocalState';
import { ID, STR, UID } from '../utils/UniqueIds.ts';
import Key from './Key';
import PubSub, { Unsubscribe } from './PubSub';
import Events from './Events';
import profileManager from '../dwotr/ProfileManager';

export default {
  followDistanceByUser: new Map<UID, number>(),
  usersByFollowDistance: new Map<number, Set<UID>>(),
  profiles: new Map<UID, any>(), // JSON.parsed event.content of profile events
  followedByUser: new Map<UID, Set<UID>>(),
  followersByUser: new Map<UID, Set<UID>>(),
  blockedUsers: new Set<UID>(),
  flaggedUsers: new Set<UID>(),

  isFollowing: function (follower: string, followedUser: string): boolean {
    const followedUserId = ID(followedUser);
    const followerId = ID(follower);
    return !!this.followedByUser.get(followerId)?.has(followedUserId);
  },

  isBlocked: function (blockedUser: string): boolean {
    const blockedUserId = ID(blockedUser);
    return this.blockedUsers.has(blockedUserId);
  },

  getFollowDistance: function (user: string): number {
    const userId = ID(user);
    const distance = this.followDistanceByUser.get(userId);
    return distance === undefined ? 1000 : distance;
  },

  setFollowed: function (followedUsers: string | string[], follow = true) {
    const myPub = Key.getPubKey();
    const myId = ID(myPub);

    if (typeof followedUsers === 'string') {
      followedUsers = [followedUsers];
    }

    followedUsers.forEach((followedUser) => {
      followedUser = Key.toNostrHexAddress(followedUser) || '';
      const followedUserId = ID(followedUser);

      if (follow && followedUser && followedUser !== myPub) {
        this.addFollower(followedUserId, myId);
      } else {
        this.removeFollower(followedUserId, myId);
      }
    });

    const existing = EventDB.findOne({ kinds: [3], authors: [myPub] });

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.followedByUser.get(myId) || []).map((id: number) => {
        const pubAddress = STR(id);
        return ['p', pubAddress];
      }),
    };

    Events.publish(event);
  },

  setBlocked: function (blockedUser: string, block = true) {
    const blockedUserId = ID(blockedUser);
    const myId = ID(Key.getPubKey());

    if (block) {
      this.blockedUsers.add(blockedUserId);
      this.removeFollower(blockedUserId, myId);
      // TODO delete dms by user
    } else {
      this.blockedUsers.delete(blockedUserId);
    }
  },

  addUserByFollowDistance(distance: number, user: UID) {
    if (!this.usersByFollowDistance.has(distance)) {
      this.usersByFollowDistance.set(distance, new Set());
    }
    if (distance <= 2) {
      let unsub;
      // TODO subscribe once param?
      // eslint-disable-next-line prefer-const
      unsub = PubSub.subscribe({ authors: [STR(user)], kinds: [0] }, () => unsub?.(), true);
    }
    this.usersByFollowDistance.get(distance)?.add(user);
    // remove from higher distances
    for (const d of this.usersByFollowDistance.keys()) {
      if (d > distance) {
        this.usersByFollowDistance.get(d)?.delete(user);
      }
    }
  },

  addFollower: function (followedUser: UID, follower: UID) {
    if (typeof followedUser !== 'number' || typeof follower !== 'number') {
      throw new Error('Invalid user id');
    }
    if (!this.followersByUser.has(followedUser)) {
      this.followersByUser.set(followedUser, new Set<UID>());
    }
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<UID>());
    }
    const myId = ID(Key.getPubKey());

    if (followedUser !== myId) {
      let newFollowDistance;
      if (follower === myId) {
        // basically same as the next "else" block, but faster
        newFollowDistance = 1;
        this.addUserByFollowDistance(newFollowDistance, followedUser);
        this.followDistanceByUser.set(followedUser, newFollowDistance);
      } else {
        const existingFollowDistance = this.followDistanceByUser.get(followedUser);
        const followerDistance = this.followDistanceByUser.get(follower);
        newFollowDistance = followerDistance && followerDistance + 1;
        if (existingFollowDistance === undefined || newFollowDistance < existingFollowDistance) {
          this.followDistanceByUser.set(followedUser, newFollowDistance);
          this.addUserByFollowDistance(newFollowDistance, followedUser);
        }
      }
    }

    this.followedByUser.get(follower)?.add(followedUser);
    if (followedUser === myId) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        localState.get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myId)?.has(follower)) {
      if (!PubSub.subscribedAuthors.has(STR(followedUser))) {
        setTimeout(() => {
          PubSub.subscribe({ authors: [STR(followedUser)] }, undefined, true);
        }, 0);
      }
    }
  },
  removeFollower: function (unfollowedUser: UID, follower: UID) {
    this.followersByUser.get(unfollowedUser)?.delete(follower);
    this.followedByUser.get(follower)?.delete(unfollowedUser);

    if (unfollowedUser === ID(Key.getPubKey())) {
      return;
    }

    // iterate over remaining followers and set the smallest follow distance
    let smallest = Infinity;
    for (const follower of this.followersByUser.get(unfollowedUser) || []) {
      const followerDistance = this.followDistanceByUser.get(follower);
      if (followerDistance !== undefined && followerDistance + 1 < smallest) {
        smallest = followerDistance + 1;
      }
    }

    if (smallest === Infinity) {
      this.followDistanceByUser.delete(unfollowedUser);
    } else {
      this.followDistanceByUser.set(unfollowedUser, smallest);
    }

    const blocked = this.blockedUsers.has(unfollowedUser);
    // TODO delete EventDB entries for this user

    if (blocked || this.followersByUser.get(unfollowedUser)?.size === 0) {
      // TODO: remove unfollowedUser from everyone's followersByUser.
      // TODO: remove from all indexes. something like lokijs could help in index management.
      //  if resulting followersByUser(u).size is 0, remove that user as well
      this.followDistanceByUser.delete(unfollowedUser);
      this.followersByUser.delete(unfollowedUser);
      PubSub.subscribedAuthors.delete(STR(unfollowedUser));
    }
  },
  // TODO subscription methods for followersByUser and followedByUser. and maybe messagesByTime. and replies
  followerCount: function (address: string) {
    const id = ID(address);
    return this.followersByUser.get(id)?.size ?? 0;
  },
  followedByFriendsCount: function (address: string) {
    let count = 0;
    const myId = ID(Key.getPubKey());
    const id = ID(address);
    for (const follower of this.followersByUser.get(id) ?? []) {
      if (this.followedByUser.get(myId)?.has(follower)) {
        count++; // should we stop at 10?
      }
    }
    return count;
  },
  block: async function (address: string, isBlocked: boolean) {
    if (isBlocked) {
      this.blockedUsers.add(ID(address));
    } else {
      this.blockedUsers.delete(ID(address));
    }
    let content: any = JSON.stringify(Array.from(this.blockedUsers));
    content = await Key.encrypt(content);
    Events.publish({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      kind: 16462,
      content,
    });
  },
  flag: function (address: string, isFlagged: boolean) {
    if (isFlagged) {
      this.flaggedUsers.add(ID(address));
    } else {
      this.flaggedUsers.delete(ID(address));
    }
    Events.publish({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      kind: 16463,
      content: JSON.stringify(Array.from(this.flaggedUsers)),
    });
  },
  getBlockedUsers(cb?: (blocked: Set<string>) => void): Unsubscribe {
    const callback = () => {
      if (cb) {
        const set = new Set<string>();
        for (const id of this.blockedUsers) {
          set.add(STR(id));
        }
        cb(set);
      }
    };
    callback();
    const myPub = Key.getPubKey();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return PubSub.subscribe({ kinds: [16462], authors: [myPub] }, callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void): Unsubscribe {
    const callback = () => {
      if (cb) {
        const set = new Set<string>();
        for (const id of this.flaggedUsers) {
          set.add(STR(id));
        }
        cb(set);
      }
    };
    callback();
    const myPub = Key.getPubKey();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return PubSub.subscribe({ kinds: [16463], authors: [myPub] }, callback);
  },
  getFollowedByUser: function (
    user: string,
    cb?: (followedUsers: Set<string>) => void,
    includeSelf = false,
  ): Unsubscribe {
    const userId = ID(user);
    const callback = () => {
      if (cb) {
        const set = new Set<string>();
        for (const id of this.followedByUser.get(userId) || []) {
          set.add(STR(id));
        }
        if (includeSelf) {
          set.add(user);
        }
        cb(set);
      }
    };
    if (this.followedByUser.has(userId) || includeSelf) {
      callback();
    }
    return PubSub.subscribe({ kinds: [3], authors: [user] }, callback);
  },
  getFollowersByUser: function (
    address: string,
    cb?: (followers: Set<string>) => void,
  ): Unsubscribe {
    const userId = ID(address);
    const callback = () => {
      if (cb) {
        const set = new Set<string>();
        for (const id of this.followersByUser.get(userId) || []) {
          set.add(STR(id));
        }
        cb(set);
      }
    };
    this.followersByUser.has(userId) && callback();
    return PubSub.subscribe({ kinds: [3], '#p': [address] }, callback); // TODO this doesn't fire when a user is unfollowed
  },
  // TODO param "proxyFirst" to skip relays if http proxy responds quickly
  getProfile(
    address: string,
    cb?: (profile: any, address: string) => void,
    verifyNip05 = false,
  ): Unsubscribe {
    const id = ID(address);
    const hexPub = STR(id);
    const callback = () => {
      cb?.(this.profiles.get(id), address);
    };

    const profile = this.profiles.get(id);
    // TODO subscribe & callback
    if (profile) {
      callback();
      if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
        Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
          console.log('NIP05 address is valid?', isValid, profile.nip05, address);
          profile.nip05valid = isValid;

          profileManager.dispatchProfile(profile); // Sets the profile in memory if it's not already there and is newer
          callback();
        });
      }
    } else {
      profileManager.loadProfile(hexPub).then((profile) => {
        if (profile) {
          // exists in DB

          profileManager.dispatchProfile(profile);
          callback();
        } else {
          profileManager.fetchProfile(hexPub).then((profile) => {
            if (!profile) return;
            Events.handle(profile);
            callback();
          });
        }
      });
    }
    return PubSub.subscribe({ kinds: [0], authors: [address] }, callback, false);
  },

  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    Events.publish(event);
  },
};
