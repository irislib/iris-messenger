import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import LocalForage from './LocalForage';
import PubSub, { Unsubscribe } from './PubSub';

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
    'npub1hu3hdctm5nkzd8gslnyedfr5ddz3z547jqcl5j88g4fame2jd08qh6h8nh', // carla
  ],
  DEFAULT_ZAP_AMOUNT: 1_000,
  followDistanceByUser: new Map<string, number>(),
  usersByFollowDistance: new Map<number, Set<string>>(),
  profiles: new Map<string, any>(), // JSON.parsed event.content of profiles
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

    const existing = Events.db.findOne({ kind: 3, pubkey: myPub });

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.followedByUser.get(myPub)).map((address: string) => {
        return ['p', address];
      }),
    };

    Events.publish(event);
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

  addUserByFollowDistance(distance: number, user: string) {
    if (!this.usersByFollowDistance.has(distance)) {
      this.usersByFollowDistance.set(distance, new Set());
    }
    if (distance <= 2) {
      let unsub;
      // TODO subscribe once param?
      // eslint-disable-next-line prefer-const
      unsub = PubSub.subscribe({ authors: [user], kinds: [0] }, () => unsub?.(), true);
    }
    this.usersByFollowDistance.get(distance).add(user);
    // remove from higher distances
    for (const d of this.usersByFollowDistance.keys()) {
      if (d > distance) {
        this.usersByFollowDistance.get(d).delete(user);
      }
    }
  },

  addFollower: function (followedUser: string, follower: string) {
    if (followedUser.startsWith('npub')) {
      console.error('addFollower: followedUser is not a hex address', followedUser);
      followedUser = Key.toNostrHexAddress(followedUser);
    }
    if (follower.startsWith('npub')) {
      console.error('addFollower: follower is not a hex address', follower);
      follower = Key.toNostrHexAddress(follower);
    }

    if (!this.followersByUser.has(followedUser)) {
      this.followersByUser.set(followedUser, new Set<string>());
    }
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<string>());
    }
    const myPub = Key.getPubKey();

    let newFollowDistance;
    if (follower === myPub) {
      // basically same as the next "else" block, but faster
      if (followedUser === myPub) {
        newFollowDistance = 0; // self-follow
      } else {
        newFollowDistance = 1;
        this.addUserByFollowDistance(newFollowDistance, followedUser);
      }
      this.followDistanceByUser.set(followedUser, newFollowDistance);
    } else {
      const existingFollowDistance = this.followDistanceByUser.get(followedUser);
      const followerDistance = this.followDistanceByUser.get(follower);
      newFollowDistance = followerDistance && followerDistance + 1;
      if (!existingFollowDistance || newFollowDistance < existingFollowDistance) {
        this.followDistanceByUser.set(followedUser, newFollowDistance);
        this.addUserByFollowDistance(newFollowDistance, followedUser);
      }
    }

    this.followedByUser.get(follower)?.add(followedUser);
    if (followedUser === myPub) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        localState.get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myPub)?.has(follower)) {
      if (!PubSub.subscribedAuthors.has(followedUser)) {
        setTimeout(() => {
          PubSub.subscribe({ authors: [followedUser] }, undefined, true);
        }, 0);
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
    // TODO delete Events.db entries for this user

    if (blocked || this.followersByUser.get(unfollowedUser)?.size === 0) {
      // TODO: remove unfollowedUser from everyone's followersByUser.
      // TODO: remove from all indexes. something like lokijs could help in index management.
      //  if resulting followersByUser(u).size is 0, remove that user as well
      this.followDistanceByUser.delete(unfollowedUser);
      this.followersByUser.delete(unfollowedUser);
      PubSub.subscribedAuthors.delete(unfollowedUser);
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
    return PubSub.subscribe({ kinds: [16462], authors: [myPub] }, callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.flaggedUsers);
    };
    callback();
    const myPub = Key.getPubKey();
    return PubSub.subscribe({ kinds: [16463], authors: [myPub] }, callback);
  },
  getFollowedByUser: function (
    user: string,
    cb?: (followedUsers: Set<string>) => void,
  ): Unsubscribe {
    const callback = () => {
      cb?.(this.followedByUser.get(user) ?? new Set());
    };
    this.followedByUser.has(user) && callback();
    return PubSub.subscribe({ kinds: [3], authors: [user] }, callback);
  },
  getFollowersByUser: function (
    address: string,
    cb?: (followers: Set<string>) => void,
  ): Unsubscribe {
    const callback = () => {
      cb?.(this.followersByUser.get(address) ?? new Set());
    };
    this.followersByUser.has(address) && callback();
    return PubSub.subscribe({ kinds: [3], '#p': [address] }, callback); // TODO this doesn't fire when a user is unfollowed
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
    // TODO subscribe & callback
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
    } else {
      fetch(`https://api.iris.to/profile/${address}`).then((res) => {
        if (res.status === 200) {
          res.json().then((profile) => {
            // TODO verify sig
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
  getDefaultZapAmount() {
    const defaultZapAmount = localState.get('defaultZapAmount').value;
    if(defaultZapAmount) {
      return defaultZapAmount;
    }

    localState.get('defaultZapAmount').put(this.DEFAULT_ZAP_AMOUNT);
    return this.DEFAULT_ZAP_AMOUNT;
  },
  setDefaultZapAmount(amount: number) {
    localState.get('defaultZapAmount').put(amount);
  },
};
