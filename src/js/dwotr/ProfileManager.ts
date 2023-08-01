import { Event } from 'nostr-tools';
import AnimalName from '../AnimalName';
import Events from '../nostr/Events';
import IndexedDB from '../nostr/IndexedDB';
import PubSub, { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { BECH32, ID } from '../nostr/UserIds';
import Key from '../nostr/Key';
import FuzzySearch from '../FuzzySearch';
import dwotrDB from './network/DWoTRDB';
import ProfileRecord from './model/ProfileRecord';
import { throttle } from 'lodash';
import Identicon from 'identicon.js';


class ProfileManager {
  loaded: boolean = false;
  saveQueue: ProfileRecord[] = [];

  save = throttle((p?: ProfileRecord) => {
    if (p) this.saveQueue.push(p);
    const queue = this.saveQueue;
    this.saveQueue = [];

    dwotrDB.profiles.bulkPut(queue).catch(() => {});
  }, 500);

  async init() {
    this.loaded = true;
  }

    // TODO: Disable for now as it's not working because of CORS
    async fetchProfile(address: string) {
    // const npub = Key.toNostrBech32Address(address, 'npub') as string;
    // const profile = await fetch(`https://api.iris.to/profile/${npub}`).then((res) => {
    //   if (res.status === 200) return res.json();
    //   else return undefined;
    // });
    // return profile;
    console.log('fetchProfile disabled. CORS issue. Requested address:', address);
    return undefined;
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

    let profile = SocialNetwork.profiles.get(id);

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
    } else  {
      // Check if profile is in IndexedDB
      this.loadProfile(address).then((profile) => {
        if (profile) {
          // exists in DB
          if (this.profileIsNewer(profile))
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

    if(!profile) {
      profile = this.createDefaultProfile(address);
      SocialNetwork.profiles.set(id, profile);
      callback();
    }

    // Then subscribe to updates via nostr relays
    return PubSub.subscribe({ kinds: [0], authors: [address] }, callback, false);
  }

  async getProfiles(
    addresses: string[],
    cb?: (profiles: Array<any>) => void,
  ): Promise<Unsubscribe> {
    if (!addresses || addresses.length === 0) return () => {};

    let result: Array<any> = [];
    let dbLookups: Array<string> = [];
    let npubs: Array<string> = [];

    // First load from memory
    for (const address of addresses) {
      if (!address) continue;
      const hexPub = Key.toNostrHexAddress(address) as string;
      const profile = SocialNetwork.profiles.get(ID(hexPub)); // ID() makes sure to register the address with an ID in the UserIds map if it's not already there
      if (profile) {
        result.push(profile);
      } else {
        dbLookups.push(hexPub);
      }

      npubs.push(Key.toNostrBech32Address(address, 'npub') as string);
    }

    // Then load from DB
    let lookupSet = new Set(dbLookups);
    const dbProfiles = await this.loadProfiles(lookupSet);

    if (dbProfiles && dbProfiles.length > 0) {
      result = result.concat(dbProfiles);
      for (const profile of dbProfiles) {
        if (profile) lookupSet.delete(profile.key);
      }
    }

    // Then load from API
    if (lookupSet.size > 0 && lookupSet.size <= 100) {
      const apiProfiles = await Promise.all(
        Array.from(lookupSet).map((address) =>
          this.fetchProfile(Key.toNostrBech32Address(address, 'npub') as string),
        ),
      );
      if (apiProfiles && apiProfiles.length > 0) {
        for (const profile of apiProfiles as Array<any>) {
          if (profile) {
            Events.handle(profile);
            result.push(profile);
            lookupSet.delete(profile.key);
          }
        }
      }
    }

    // Fill in default profile for missing profiles
    for (const hexPub of lookupSet) {
      let profile = this.createDefaultProfile(hexPub);
      SocialNetwork.profiles.set(ID(profile.key), profile);
      result.push(profile); // Fill in default profile with animal names
    }

    // Then callback
    if (result.length > 0)
      // The list should contain a profile for each address
      cb?.(result);

    // Then subscribe to updates via nostr relays
    const callback = (event: Event) => {
      const id = ID(event.pubkey);
      let profile = SocialNetwork.profiles.get(id);
      cb?.([profile]);
    };

    return PubSub.subscribe({ kinds: [0], authors: npubs }, callback, false);
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

    let profile = {
      ...p,
      key: npub,
      name,
      displayName: display_name,
      picture,
      isDefault,
    } as ProfileRecord;

    return profile;
  }

  getDefaultProfile(id: number | undefined) {
    if (!id) return undefined;
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(BECH32(id));
  }

  createDefaultProfile(npub: string): ProfileRecord {
    let profile = this.sanitizeProfile({}, npub);
    profile.isDefault = true;
    return profile;
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

  createImageUrl(str: string, width: number = 30, height: number = 30) {
    //if (profile && profile.picture) return profile.picture;

    const identicon = new Identicon(str, {
      width,
      height,
      format: `svg`,
    });
    return `data:image/svg+xml;base64,${identicon.toString()}`;
  }

  ensurePicture(profile: ProfileRecord) : string {
    if (!profile.picture) {
      profile.picture = this.createImageUrl(profile.key);
    }
    return profile.picture;
  } 




}

const profileManager = new ProfileManager();

profileManager.init();

export default profileManager;
