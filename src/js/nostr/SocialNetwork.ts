import Loki from 'lokijs';

import localState from '../LocalState';

import Events from './Events';
import Key from './Key';
import LocalForage from './LocalForage';
import PubSub, { Unsubscribe } from './PubSub';

const db = new Loki('users');
const users = db.addCollection('users', {
  indices: ['followDistance', 'blocked', 'flagged'],
  unique: ['pubkey'],
});
const follows = db.addCollection('follows', {
  indices: ['follower', 'followed'],
  unique: ['id'],
});

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
  users,
  follows,
  profiles: new Map<string, any>(), // JSON.parsed event.content of profiles
  setFollowed: function (followedUsers: string | string[], follow = true) {
    if (typeof followedUsers === 'string') {
      followedUsers = [followedUsers];
    }
    const myPub = Key.getPubKey();
    followedUsers.forEach((followedUser) => {
      followedUser = Key.toNostrHexAddress(followedUser);
      if (follow && followedUser && followedUser !== myPub) {
        this.addFollow({ followed: followedUser, follower: myPub });
      } else {
        this.removeFollower(followedUser, myPub);
      }
    });

    const existing = Events.db.findOne({ kind: 3, pubkey: myPub });

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.follows.find({ follower: myPub })).map(({ followed }) => {
        return ['p', followed];
      }),
    };

    Events.publish(event);
    PubSub.subscribeToAuthors();
  },

  isFollowing(follower, followed) {
    return !!this.follows.findOne({ follower, followed });
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

  followDistanceByUser(user: string): number {
    return this.users.by('pubkey', user)?.followDistance || 1000;
  },

  upsertUser(user: any) {
    try {
      this.users.insert(user);
    } catch (e) {
      this.users.findAndUpdate({ pubkey: user.pubkey }, (existingUser) => {
        return { ...existingUser, ...user };
      });
    }
  },

  addFollow: function ({ followed, follower }) {
    if (followed.startsWith('npub')) {
      console.error('addFollow: followedUser is not a hex address', followed);
      followed = Key.toNostrHexAddress(followed);
    }
    if (follower.startsWith('npub')) {
      console.error('addFollow: follower is not a hex address', follower);
      follower = Key.toNostrHexAddress(follower);
    }

    const myPub = Key.getPubKey();

    if (follower === myPub) {
      // basically same as the next "else" block, but faster
      if (followed !== myPub) {
        this.upsertUser({ pubkey: followed, blocked: false, flagged: false, followDistance: 1 });
      }
    } else {
      const existingFollowDistance = this.users.by({ pubkey: followed })?.followDistance;
      const followerDistance = this.users.by({ pubkey: follower })?.followDistance;
      const newFollowDistance = followerDistance && followerDistance + 1;
      if (existingFollowDistance === undefined || newFollowDistance < existingFollowDistance) {
        this.upsertUser({
          pubkey: followed,
          blocked: false,
          flagged: false,
          followDistance: newFollowDistance,
        });
      }
    }

    if (followed === myPub) {
      if (!this.follows.findOne({ followed: myPub })) {
        localState.get('hasNostrFollowers').put(true);
      }
    }
    try {
      this.follows.insert({ id: follower + followed, followed, follower });
    } catch (e) {
      // probably already exists
      // console.error(e);
    }
    if (follower === myPub) {
      PubSub.subscribe([{ kinds: [1, 5, 6, 7], authors: [followed] }]);
    }
  },
  removeFollower: function (unfollowedUser: string, follower: string) {
    // iterate over remaining followers and set the smallest follow distance
    this.follows.findAndRemove({ id: follower + unfollowedUser });
    let smallest = 1000;
    for (const follow of this.follows.find({ followed: unfollowedUser })) {
      const distance = this.users.findOne({ pubkey: follow.follower })?.followDistance + 1;
      if (distance && distance < smallest) {
        smallest = distance;
      }
    }

    this.upsertUser({ pubkey: unfollowedUser, followDistance: smallest });
    const blocked = this.users.findOne({ pubkey: unfollowedUser, blocked: true });

    if (blocked || this.follows.find({ followed: unfollowedUser }).length === 0) {
      Events.db.findAndRemove({ author: unfollowedUser });
      this.follows.findAndRemove({ follower: unfollowedUser });
      this.follows.findAndRemove({ followed: unfollowedUser });
      this.users.findAndRemove({ pubkey: unfollowedUser });
      // TODO: remove users that have 0 followers after this operation
      PubSub.subscribedUsers.delete(unfollowedUser);
    }
    LocalForage.saveEvents();
  },
  followedByFriendsCount: function (address: string) {
    let count = 0;
    const myPub = Key.getPubKey();
    for (const follower of this.follows.find({ followed: address }).map((f) => f.follower)) {
      if (this.follows.findOne({ follower: myPub, followed: follower })) {
        count++; // should we stop at 10 for performance reasons?
      }
    }
    return count;
  },
  isBlocked(address: string) {
    return this.users.findOne({ pubkey: address, blocked: true }) !== null;
  },
  block: async function (address: string, isBlocked: boolean) {
    this.upsertUser({ pubkey: address, blocked: isBlocked });
    let content: any = JSON.stringify(Array.from(this.blockedUsers));
    content = await Key.encrypt(content);
    Events.publish({
      kind: 16462,
      content,
    });
  },
  flag: function (address: string, isFlagged: boolean) {
    this.upsertUser({ pubkey: address, flagged: isFlagged });
    Events.publish({
      kind: 16463,
      content: JSON.stringify(Array.from(this.flaggedUsers)),
    });
  },
  getBlockedUsers(cb?: (blocked: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.users.find({ blocked: true }).map((u) => u.pubkey));
    };
    callback();
    const myPub = Key.getPubKey();
    return PubSub.subscribe([{ kinds: [16462], authors: [myPub] }], callback);
  },
  getFlaggedUsers(cb?: (flagged: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.user.find({ flagged: true }).map((u) => u.pubkey));
    };
    callback();
    const myPub = Key.getPubKey();
    return PubSub.subscribe([{ kinds: [16463], authors: [myPub] }], callback);
  },
  followedByUser(address: string): string[] {
    return this.follows.find({ follower: address }).map((f) => f.followed);
  },
  getFollowedByUser: function (user: string, cb?: (followedUsers: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.followedByUser(user));
    };
    callback();
    return PubSub.subscribe([{ kinds: [3], authors: [user] }], callback);
  },
  followersByUser(address: string): string[] {
    return this.follows.find({ followed: address }).map((f) => f.follower);
  },
  getFollowersByUser: function (address: string, cb?: (followers: string[]) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.followersByUser(address));
    };
    callback();
    return PubSub.subscribe([{ kinds: [3], '#p': [address] }], callback); // TODO this doesn't fire when a user is unfollowed
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
    } else if (!PubSub.subscribedProfiles.has(address)) {
      fetch(`https://api.iris.to/profile/${address}`).then((res) => {
        if (res.status === 200) {
          res.json().then((profile) => {
            // TODO verify sig
            Events.handle(profile);
          });
        }
      });
    }
    PubSub.subscribedProfiles.add(address);
    return PubSub.subscribe([{ authors: [address], kinds: [0, 3] }], callback);
  },
  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    Events.publish(event);
  },
};
