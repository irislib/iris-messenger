import { Event } from 'nostr-tools';
import localState from '../LocalState';
import Key from './Key';
import LocalForage from './LocalForage';
import PubSub, { Unsubscribe } from './PubSub';
import FuzzySearch from '../FuzzySearch';
import Events from './Events';
import IndexedDB from './IndexedDB';
import AnimalName from '../AnimalName';

export default {
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
      followedUser = Key.toNostrHexAddress(followedUser) || '';
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
      tags: Array.from(this.followedByUser.get(myPub) || []).map((address: string) => {
        return ['p', address];
      }),
    };

    Events.publish(event);
  },

  setBlocked: function (blockedUser: string, block = true) {
    blockedUser = Key.toNostrHexAddress(blockedUser) || '';
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
    this.usersByFollowDistance.get(distance)?.add(user);
    // remove from higher distances
    for (const d of this.usersByFollowDistance.keys()) {
      if (d > distance) {
        this.usersByFollowDistance.get(d)?.delete(user);
      }
    }
  },

  addFollower: function (followedUser: string, follower: string) {
    if (followedUser.startsWith('npub')) {
      console.error('addFollower: followedUser is not a hex address', followedUser);
      followedUser = Key.toNostrHexAddress(followedUser) || '';
    }
    if (follower.startsWith('npub')) {
      console.error('addFollower: follower is not a hex address', follower);
      follower = Key.toNostrHexAddress(follower) || '';
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      kind: 16462,
      content,
    });
  },
  flag: function (address: string, isFlagged: boolean) {
    isFlagged ? this.flaggedUsers.add(address) : this.flaggedUsers.delete(address);
    Events.publish({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return PubSub.subscribe({ kinds: [16462], authors: [myPub] }, callback);
  },
  getFlaggedUsers(cb?: (flagged: Set<string>) => void): Unsubscribe {
    const callback = () => {
      cb?.(this.flaggedUsers);
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
