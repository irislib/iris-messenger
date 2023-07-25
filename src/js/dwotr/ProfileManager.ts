import { Event } from 'nostr-tools';
import AnimalName from '../AnimalName';
import Events from '../nostr/Events';
import IndexedDB from '../nostr/IndexedDB';
import PubSub, { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { ID } from '../nostr/UserIds';
import Key from '../nostr/Key';
import FuzzySearch from '../FuzzySearch';
import dwotrDB from './network/DWoTRDB';
import ProfileRecord from './model/ProfileRecord';
import { throttle } from 'lodash';

class ProfileManager {
  loaded: boolean = false;
  saveQueue: ProfileRecord[] = [];

  save = throttle((p?: ProfileRecord) => {
    if (p) this.saveQueue.push(p);
    const queue = this.saveQueue;
    this.saveQueue = [];

    //   async saveProfile(profile: ProfileRecord): Promise<number | undefined> {
    //     if (!profile) return undefined;
    //     if (profile.id > 0) {
    //       await dwotrDB.profiles.update(profile.id, profile);
    //       return profile.id;
    //     } else {
    //       profile.id = (await dwotrDB.profiles.add(profile)) as number;
    //     }
    //     return profile.id;
    //   }

    dwotrDB.profiles.bulkPut(queue).catch(() => {});
  }, 500);

  async init() {
    this.loaded = true;
  }

  async fetchProfile(address: string) {
    const profile = await fetch(`https://api.iris.to/profile/${address}`).then((res) => {
      if (res.status === 200) return res.json();
      else return undefined;
    });
    return profile;
  }

  quickProfile(address: string) {
    const id = ID(address);
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    else return this.sanitizeProfile({}, address);
  }

  getProfile(
    address: string,
    cb?: (profile: any, address: string) => void,
    verifyNip05 = false,
  ): Unsubscribe {
    const id = ID(address);
    const callback = () => {
      cb?.(SocialNetwork.profiles.get(id), address);
    };

    const profile = SocialNetwork.profiles.get(id);

    if (profile) {
      callback();
      if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
        // TODO verify NIP05 address
        // Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
        //   console.log('NIP05 address is valid?', isValid, profile.nip05, address);
        //   profile.nip05valid = isValid;
        //   SocialNetwork.profiles.set(id, profile);
        //   callback();
        // });
      }
    }

    if (!profile) {
      // Check if profile is in IndexedDB
      this.loadProfile(address).then((profile) => {
        if (profile) {
          // exists in DB
          if (this.profileIsNewer(profile))
            // but is it newer?
            this.addProfileToMemory(profile);

          callback(); // callback with profile
        } else {
          // Check if profile is in API
          profileManager.fetchProfile(address).then((profile) => {
            if (!profile) return; // not in API
            // TODO verify sig
            if (this.profileIsNewer(profile))
              // but is it newer?
              this.addProfileEvent(profile);

            callback();
          });
          return;
        }
      });
    }

    // Then subscribe to updates via nostr relays
    return PubSub.subscribe({ kinds: [0], authors: [address] }, callback, false);
  }

  async getProfiles(
    addresses: string[],
    cb?: (profiles: Array<any>) => void,
  ): Promise<Unsubscribe> {
    if (!addresses || addresses.length === 0) return () => {};

    let list: Array<any> = [];
    let dbLookups: Array<string> = [];

    // First load from memory
    for (const address of addresses) {
      const id = ID(address);
      const item = SocialNetwork.profiles.get(id);
      if (item) list.push(item);
      else dbLookups.push(address);
    }

    // Then load from DB
    let lookupSet = new Set(dbLookups);
    const dbProfiles = await this.loadProfiles(lookupSet);

    if (dbProfiles && dbProfiles.length > 0) {
      list = list.concat(dbProfiles);
      for (const profile of dbProfiles) {
        if (profile) lookupSet.delete(profile.key);
      }
    }

    // Then load from API
    if (lookupSet.size > 0 && lookupSet.size <= 100) {
      const apiProfiles = await Promise.all(
        Array.from(lookupSet).map((address) => this.fetchProfile(address)),
      );
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
    if (list.length > 0)
      // The list should contain a profile for each address
      cb?.(list);

    // Then subscribe to updates via nostr relays
    const callback = (event: Event) => {
      const id = ID(event.pubkey);
      let profile = SocialNetwork.profiles.get(id);
      cb?.([profile]);
    };

    return PubSub.subscribe({ kinds: [0], authors: addresses }, callback, false);
  }

  async loadProfiles(addresses: Set<string>) {
    const list = await dwotrDB.profiles.where('key').anyOf(Array.from(addresses)).toArray();
    if (!list) return undefined;
    const profiles = list.map((p) => this.addProfileToMemory(p));
    return profiles;
  }

  async loadProfile(address: string) {
    const dbProfile = (await dwotrDB.profiles.get({ key: address })) as ProfileRecord;

    return this.addProfileToMemory(dbProfile);
  }

  saveProfile(profile: ProfileRecord) {
    this.saveQueue.push(profile);
    this.save();
  }

  async loadAllProfiles() {
    console.time('Loading profiles from DWoTRDB');
    const list = await dwotrDB.profiles.toArray();
    if (!list) return undefined;
    for (const p of list) {
      this.addProfileToMemory(p);
    }

    //this.profilesLoaded = true;
    console.timeEnd('Loading profiles from DWoTRDB');
    console.log('Loaded profiles from DWoTRDB - ' + list.length + ' profiles');
  }

  sanitizeProfile(p: any, npub: string): ProfileRecord {
    if (!p) p = { name: '', displayName: '', default: false };

    let name = p.name?.trim().slice(0, 100) || '';
    let isDefault = p.name || p.display_name ? false : true;
    let picture = p.picture;

    if (!name) {
      name = AnimalName(Key.toNostrBech32Address(npub, 'npub') || npub);
    }

    let display_name = p.display_name?.trim().slice(0, 100) || name;

    return {
      ...p,
      key: npub,
      name,
      displayName: display_name,
      picture,
      isDefault,
    } as ProfileRecord;
  }

  profileIsNewer(profile: ProfileRecord) {
    const existingProfile = SocialNetwork.profiles.get(ID(profile.key));
    if (existingProfile) {
      if (existingProfile.created_at > profile.created_at) return false;
    }
    return true;
  }

  addProfileToMemory(profile: ProfileRecord) {
    if (!profile) return undefined;

    SocialNetwork.profiles.set(ID(profile.key), profile);

    FuzzySearch.add({
      key: profile.key,
      name: profile.name,
      display_name: profile.display_name,
      followers: SocialNetwork.followersByUser.get(ID(profile.key)) ?? new Set(),
    });
    return profile;
  }

  addProfileEvent(event: Event) {
    try {
      const rawProfile = JSON.parse(event.content);
      rawProfile.created_at = event.created_at;

      let profile = this.sanitizeProfile(rawProfile, event.pubkey);
      this.save(profile); // Save to DWoTRDB

      return this.addProfileToMemory(profile);
    } catch (e) {
      // Remove the event from IndexedDB if it has an id wich means it was saved there
      if (event.id) {
        IndexedDB.db.events.delete(event.id);
      }
      console.error(e);
      return undefined;
    }
  }
}

const profileManager = new ProfileManager();

profileManager.init();

export default profileManager;
