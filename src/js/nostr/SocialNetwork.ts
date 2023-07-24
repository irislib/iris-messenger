import { Event } from 'nostr-tools';
import localState from '../LocalState';
import Key from './Key';
import LocalForage from './LocalForage';
import PubSub, { Unsubscribe } from './PubSub';
import FuzzySearch from '../FuzzySearch';
import Events from './Events';
import IndexedDB from './IndexedDB';
import AnimalName from '../AnimalName';
import { ID, PUB, UserId } from './UserIds';

export default {
  followDistanceByUser: new Map<UserId, number>(),
  usersByFollowDistance: new Map<number, Set<UserId>>(),
  profiles: new Map<UserId, any>(), // JSON.parsed event.content of profile events
  followedByUser: new Map<UserId, Set<UserId>>(),
  followersByUser: new Map<UserId, Set<UserId>>(),
  blockedUsers: new Set<UserId>(),
  flaggedUsers: new Set<UserId>(),

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
    return this.followDistanceByUser.get(userId) || Infinity;
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

    const existing = Events.db.findOne({ kind: 3, pubkey: myPub });

    const event = {
      kind: 3,
      content: existing?.content || '',
      tags: Array.from(this.followedByUser.get(myId) || []).map((id: number) => {
        const pubAddress = PUB(id);
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
      Events.directMessagesByUser.delete(blockedUser);
    } else {
      this.blockedUsers.delete(blockedUserId);
    }
  },

  addUserByFollowDistance(distance: number, user: UserId) {
    if (!this.usersByFollowDistance.has(distance)) {
      this.usersByFollowDistance.set(distance, new Set());
    }
    if (distance <= 2) {
      let unsub;
      // TODO subscribe once param?
      // eslint-disable-next-line prefer-const
      unsub = PubSub.subscribe({ authors: [PUB(user)], kinds: [0] }, () => unsub?.(), true);
    }
    this.usersByFollowDistance.get(distance)?.add(user);
    // remove from higher distances
    for (const d of this.usersByFollowDistance.keys()) {
      if (d > distance) {
        this.usersByFollowDistance.get(d)?.delete(user);
      }
    }
  },

  addFollower: function (followedUser: UserId, follower: UserId) {
    if (typeof followedUser !== 'number' || typeof follower !== 'number') {
      throw new Error('Invalid user id');
    }
    if (!this.followersByUser.has(followedUser)) {
      this.followersByUser.set(followedUser, new Set<UserId>());
    }
    this.followersByUser.get(followedUser)?.add(follower);

    if (!this.followedByUser.has(follower)) {
      this.followedByUser.set(follower, new Set<UserId>());
    }
    const myId = ID(Key.getPubKey());

    let newFollowDistance;
    if (follower === myId) {
      // basically same as the next "else" block, but faster
      if (followedUser === myId) {
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
    if (followedUser === myId) {
      if (this.followersByUser.get(followedUser)?.size === 1) {
        localState.get('hasNostrFollowers').put(true);
      }
    }
    if (this.followedByUser.get(myId)?.has(follower)) {
      if (!PubSub.subscribedAuthors.has(PUB(followedUser))) {
        setTimeout(() => {
          PubSub.subscribe({ authors: [PUB(followedUser)] }, undefined, true);
        }, 0);
      }
    }
  },
  removeFollower: function (unfollowedUser: UserId, follower: UserId) {
    this.followersByUser.get(unfollowedUser)?.delete(follower);
    this.followedByUser.get(follower)?.delete(unfollowedUser);

    // iterate over remaining followers and set the smallest follow distance
    let smallest = 1000;
    for (const follower of this.followersByUser.get(unfollowedUser) || []) {
      const distance = (this.followDistanceByUser.get(follower) || Infinity) + 1;
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
      PubSub.subscribedAuthors.delete(PUB(unfollowedUser));
    }
    LocalForage.saveEvents();
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
          set.add(PUB(id));
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
          set.add(PUB(id));
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
  ): Unsubscribe {
    const userId = ID(user);
    const callback = () => {
      if (cb) {
        const set = new Set<string>();
        for (const id of this.followedByUser.get(userId) || []) {
          set.add(PUB(id));
        }
        cb(set);
      }
    };
    this.followedByUser.has(userId) && callback();
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
          set.add(PUB(id));
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
          this.profiles.set(id, profile);
          callback();
        });
      }
    } else {
      this.fetchProfile(address).then((profile) => {
        if (!profile) return;
        Events.handle(profile);
        callback();
      });
      // fetch(`https://api.iris.to/profile/${address}`).then((res) => {
      //   if (res.status === 200) {
      //     res.json().then((profile) => {
      //       // TODO verify sig
      //       Events.handle(profile);
      //       callback();
      //     });
      //   }
      // });
    }
    return PubSub.subscribe({ kinds: [0], authors: [address] }, callback, false);
  },
  fetchProfile: async function (address: string) {
    const profile = await fetch(`https://api.iris.to/profile/${address}`).then((res) => {
      if (res.status === 200)
        return res.json();
      else 
        return undefined;
    });
    return profile;
  },

  getProfiles: async function (addresses: string[],     
    cb?: (profiles: Array<any>) => void,
  ):  Promise<Unsubscribe> {
    if(!addresses || addresses.length === 0) return () => {};

    let list: Array<any> = [];
    let dbLookups: Array<string> = [];

    // First load from memory
    for (const address of addresses) {
      const item = this.profiles.get(address);
      if (item)
        list.push(item);
      else 
        dbLookups.push(address);
    }

    // Then load from DB
    let lookupSet = new Set(dbLookups);
    const dbProfiles = await this.loadProfiles(lookupSet);

    if (dbProfiles && dbProfiles.length > 0) {
      list = list.concat(dbProfiles);
      for (const profile of dbProfiles) {
        lookupSet.delete(profile.key);
      }
    }

    // Then load from API
    if (lookupSet.size > 0 && lookupSet.size <= 100) {
      const apiProfiles = await Promise.all(Array.from(lookupSet).map((address) => this.fetchProfile(address)));
      if (apiProfiles && apiProfiles.length > 0) {
        for (const profile of apiProfiles) {
          if (profile) {
            Events.handle(profile);
            list.push(profile);
            lookupSet.delete(profile.key);
          }
        }
      }
    }

    // Fill in default profile for missing profiles
    for (const address of lookupSet) {
      list.push(this.sanitizeProfile({}, address)); // Fill in default profile with animal names
    }

    // Then callback
    if(list.length > 0) // The list should contain a profile for each address
      cb?.(list);
    
    // Then subscribe to updates via nostr relays
    const callback = (event: Event) => {
      let profile = this.profiles.get(event.pubkey);
      cb?.([profile]);
    };

    return PubSub.subscribe({ kinds: [0], authors: addresses }, callback, false);
  },

  loadProfiles: async function (addresses: Set<string>) {
    const list = await IndexedDB.db.events.where({kind: 0}).filter((event) => addresses.has(event.pubkey)).toArray();
    if (!list) return undefined;
    const profiles = list.map((event) => this.addProfile(event)).filter((p) => p);
    return profiles;
  },


  loadProfile: async function (address: string) {
    const event = await IndexedDB.db.events.get({ kind: 0, pubkey: address });
    if (!event) return undefined;
    return this.addProfile(event);
  },

  loadAllProfiles: async function () {
    console.time('Loading profiles from IndexedDB');
    let events = await IndexedDB.db.events.where({ kind: 0 }).toArray();
    if (!events) return;

    for (const event of events) {
      this.addProfile(event);
    }
    //this.profilesLoaded = true;
    console.timeEnd('Loading profiles from IndexedDB');
    console.log('Loaded profiles from IndexedDB - ' + events.length + ' events');
  },

  sanitizeProfile: function(p: any, npub:string) {
    if (!p) 
      p = { name: '', displayName: '', isNameGenerated: false, dummy: true };
  
    let name = p.name?.trim().slice(0, 100) || '';
    let isNameGenerated = p.name || p.display_name ? false : true;
    let picture = p.picture;
  
    if (!name) {
      name = AnimalName(Key.toNostrBech32Address(npub, 'npub') || npub);
      isNameGenerated = true;
    }
  
    let displayName = p.display_name?.trim().slice(0, 100) || name;
  
    return { ...p, key:npub, name, displayName, picture, isNameGenerated, dummy: false };
  },
  
  addProfile: function (event: Event) {
    try {
      const rawProfile = JSON.parse(event.content);
      rawProfile.created_at = event.created_at;

      let profile = this.sanitizeProfile(rawProfile, event.pubkey);

      this.profiles.set(event.pubkey, profile);
      //const key = Key.toNostrBech32Address(event.pubkey, 'npub');
      FuzzySearch.add({
        key: event.pubkey,
        name: profile.name,
        display_name: profile.display_name,
        followers: this.followersByUser.get(event.pubkey) ?? new Set(),
      });
      return profile;

    } catch (e) {
      // Remove the event from IndexedDB if it has an id wich means it was saved there
      if(event.id) {
        IndexedDB.db.events.delete(event.id);
      }
      console.error(e);
      //return this.sanitizeProfile({}, event.pubkey); // return a dummy profile as replacement
      return undefined;
    }
  },

  setMetadata(data: any) {
    const event = {
      kind: 0,
      content: JSON.stringify(data),
    };
    Events.publish(event);
  },
};
