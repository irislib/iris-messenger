import { Event } from 'nostr-tools';
import Events from '../nostr/Events';
import IndexedDB from '../nostr/IndexedDB';
import PubSub, { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import Key from '../nostr/Key';
import ProfileRecord, { ProfileMemory } from './model/ProfileRecord';
import { throttle } from 'lodash';
import Identicon from 'identicon.js';
import OneCallQueue from './Utils/OneCallQueue';
import storage from './Storage';
import { hexName } from './Utils';
import { ProfileEvent } from './network/ProfileEvent';
import FuzzySearch from '@/nostr/FuzzySearch';
import { ID, STR } from '@/utils/UniqueIds';

class ProfileManager {
  loaded: boolean = false;
  #saveQueue: ProfileRecord[] = [];
  #saving: boolean = false;
  history: { [key: string]: any } = {};

  //--------------------------------------------------------------------------------
  // Saves profile(s) to IndexedDB
  //--------------------------------------------------------------------------------
  saveBulk = throttle(() => {
    if (this.#saving) {
      this.saveBulk(); // try again later
      return;
    }

    this.#saving = true;

    const queue = this.#saveQueue;
    this.#saveQueue = [];
        
    storage.profiles.bulkPut(queue).finally(() => {
      this.#saving = false;
    });
  }, 500);



  async init() {
    this.loaded = true;
  }


  //--------------------------------------------------------------------------------
  // Validates a profile object
  // TODO: Add more validation
  // Returns true if the profile seems valid and not corrupted or empty
  //--------------------------------------------------------------------------------
  validateProfile(profile: any) {
    if (!profile) return false;
    
    return true;
  }


  //--------------------------------------------------------------------------------
  // Fetches a profile from the API
  //--------------------------------------------------------------------------------
  async fetchProfile(hexPub: string) {
    try {
      let url = `https://api.iris.to/profile/${hexPub}`;

      let { data } = await OneCallQueue<any>(url, async () => {
        // Fetch the resource and return the response body as a JSON object
        let res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        if (res && res.status === 200) {
          let data = await res.json();
          return { res, data };
        }
        return { res, data: undefined };
      });

      return data;
    } catch (error: any) {
      console.log('There was a problem with the fetch operation: ' + error.message);
    }
  }

  //--------------------------------------------------------------------------------
  // Fetches profiles from the API and saves them to IndexedDB with a callback
  // to update the UI as they come in. Errors like 500 can hold up the whole batch, therefore
  // we don't want to wait for the whole batch to complete before updating the UI.
  //--------------------------------------------------------------------------------
  fetchProfiles(hexPubs: string[], cb: (profile: any) => void) {
    if (!hexPubs || hexPubs.length === 0) return;

    const fetch = async (key: string) => {
      const profile = await this.fetchProfile(key);
      if (!profile) return;
      if(profileManager.validateProfile(profile)) {
        Events.handle(profile);
        cb(profile);
      }
    };

    for (const hexPub of hexPubs) {
      fetch(hexPub);
    }
  }

  //--------------------------------------------------------------------------------
  // Loading profiles from IndexedDB 
  //--------------------------------------------------------------------------------
  async loadProfiles(addresses: Set<string>): Promise<ProfileRecord[]> {
    return await storage.profiles.where('key').anyOf(Array.from(addresses)).toArray();
  }

  //--------------------------------------------------------------------------------
  // Loading a profile from IndexedDB
  //--------------------------------------------------------------------------------
  async loadProfile(hexPub: string): Promise<ProfileRecord | undefined> {
    let profile = await OneCallQueue<ProfileRecord>(`loadProfile${hexPub}`, async () => {
      return storage.profiles.get({ key: hexPub });
    });

    if (profile?.isDefault) {
      return undefined;
    }

    return profile;
  }

  //--------------------------------------------------------------------------------
  // Loading or fetching a profile from IndexedDB or the API or memory
  //--------------------------------------------------------------------------------
  async getProfile(address: string): Promise<ProfileRecord> {
    let result = await this.getProfiles([address]);
    return result?.[0];
  }

  //--------------------------------------------------------------------------------
  // Loading or fetching profiles from IndexedDB or the API or memory
  //--------------------------------------------------------------------------------
  async getProfiles(addresses: string[]): Promise<Array<ProfileRecord>> {
    if (!addresses || addresses.length === 0) return [];

    let profiles: Array<any> = [];
    let dbLookups: Array<string> = [];
    let authors: Array<string> = [];

    // First load from memory
    for (const address of addresses) {
      if (!address) continue;
      const hexPub = Key.toNostrHexAddress(address) as string;
      const profile = SocialNetwork.profiles.get(ID(hexPub)); // ID() makes sure to register the address with an ID in the Ids map if it's not already there
      if (profile) {
        profiles.push(profile);
      } else {
        dbLookups.push(hexPub);
      }

      authors.push(hexPub);
    }

    if (dbLookups.length > 0) {
      let lookupSet = new Set(dbLookups);

      console.timeStamp('Loading profiles from IndexedDB');
      console.time('LoadDB');

      // Then load from DB
      const dbProfiles = await this.loadProfiles(lookupSet);

      if (dbProfiles && dbProfiles.length > 0) {
        profiles = profiles.concat(dbProfiles);
        for (const profile of dbProfiles) {
          if (profile) lookupSet.delete(profile.key);
        }
      }

      console.timeEnd('LoadDB');

      // Then load from API
      // if (lookupSet.size > 0 && lookupSet.size <= 100) {
      //   let list = Array.from(lookupSet).map((a) => a);

      // }

      // Fill in default profile for missing profiles
      for (const hexPub of lookupSet) {
        let profile = this.createDefaultProfile(hexPub);
        SocialNetwork.profiles.set(ID(profile.key), profile);
        profiles.push(profile); // Fill in default profile with animal names
      }

      // Then save to memory
      for (const profile of profiles) {
        if (!profile || !this.isProfileNewer(profile)) continue;

        this.addProfileToMemory(profile);
      }
    }

    // Subscriptions on relays have been removed and should be called elsewhere

    return profiles;
  }

  saveProfile(profile: ProfileRecord) {
    if (profile?.isDefault || profile?.isDefault == undefined) return; // don't save default profiles
    this.#saveQueue.push(profile);
    this.saveBulk();
  }

  async loadAllProfiles() {
    console.time('Loading profiles from DWoTRDB');
    const list = await storage.profiles.toArray();
    if (!list) return undefined;
    for (const p of list) {
      this.addProfileToMemory(p);
    }

    //this.profilesLoaded = true;
    console.timeEnd('Loading profiles from DWoTRDB');
    console.log('Loaded profiles from DWoTRDB - ' + list.length + ' profiles');
  }

  sanitizeProfile(p: any, hexPub: string): ProfileRecord {
    if (!p) return this.createDefaultProfile(hexPub);

    // Make sure we have a name
    let name =
      p.name || p.username || p.display_name || p.displayName || p.nip05 || p.lud16 || p.lud06; // Find a name
    name = p.name?.trim().slice(0, 100) || ''; // Trim and limit to 100 chars

    // Make sure we have a display name
    let display_name = (p.display_name || p.displayName)?.trim().slice(0, 200);

    // Make sure that we don't store large values
    display_name = p.display_name?.trim().slice(0, 200);
    let about = p.about?.trim().slice(0, 10000);
    let picture = p.picture?.trim().slice(0, 4096);
    let banner = p.banner?.trim().slice(0, 4096);
    let website = p.website?.trim().slice(0, 4096);
    let nip05 = p.nip05?.trim().slice(0, 4096);
    let lud06 = p.lud06?.trim().slice(0, 4096);
    let lud16 = p.lud16?.trim().slice(0, 4096);

    let profile = {
      ...p,
      key: hexPub,
      name,
      display_name,
      about,
      picture,
      banner,
      website,
      nip05,
      lud06,
      lud16,
      isDefault: false,
    } as ProfileRecord;

    return profile;
  }

  createDefaultProfile(hexPub: string): ProfileRecord {
    let profile = new ProfileRecord();
    profile.key = hexPub;
    profile.name = hexName(hexPub);
    profile.isDefault = true;
    return profile;
  }

  getDefaultProfile(id: number | undefined) : ProfileRecord | undefined {
    if (!id) return undefined;
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(STR(id));
  }

  quickProfile(address: string) {
    const id = ID(address);
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(STR(id));
  }

  getMemoryProfile(id: number): ProfileRecord {
    const profile = SocialNetwork.profiles.get(id);

    if (profile) return profile;
    return this.createDefaultProfile(STR(id));
  }

  isProfileNewer(profile: ProfileRecord): boolean {
    if (!profile?.key) return false;

    const existingProfile = SocialNetwork.profiles.get(ID(profile.key));

    return (
      !existingProfile ||
      (profile.isDefault === false && profile.created_at > existingProfile.created_at)
    );
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
    if (!event || !event.pubkey || !event.content) return undefined;

    try {
      const raw = JSON.parse(event.content);
      if (!raw) return undefined;

      raw.created_at = event.created_at; // Add the event timestamp to the profile

      let profile = this.sanitizeProfile(raw, event.pubkey);

      //Always save the profile to DWoTRDB
      this.saveProfile(profile); // Save to DWoTRDB

      return this.addProfileToMemory(profile); // Save to memory
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

  ensurePicture(profile: ProfileRecord): string {
    if (!profile.picture) {
      profile.picture = this.createImageUrl(profile.key);
    }
    return profile.picture;
  }

  // ---- New system ----

  subscriptions = new Map<string, any>();

  subscriptionCallback(event: Event) {
    let profile = SocialNetwork.profiles.get(ID(event.pubkey));
    profileManager.dispatchProfile(profile);
  }

  subscribe(address: string): Unsubscribe {
    const hexPub = Key.toNostrHexAddress(address) as string;
    const id = ID(hexPub);

    let profile = SocialNetwork.profiles.get(id);

    if (!profile || profile.isDefault) {
      // Check if profile is in IndexedDB
      this.loadProfile(hexPub).then((profile) => {
        if (profile) {
          // exists in DB
          this.dispatchProfile(profile);
        } else {
          // Check if profile is in API
          profileManager.fetchProfile(hexPub).then((data) => {
            // TODO verify sig
            if (!data) return;

            let profile = this.addProfileEvent(data);
            if (!profile) return;

            this.dispatchProfile(profile as ProfileRecord);
          });
        }
      });
    }

    // Then subscribe to updates via nostr relays
    let unsub = PubSub.subscribe(
      { kinds: [0], authors: [hexPub] },
      this.subscriptionCallback,
      false,
    );
    return unsub;
  }

  dispatchProfile(profile: ProfileRecord) {
    if (!profile) return;

    if (this.isProfileNewer(profile)) this.addProfileToMemory(profile);

    ProfileEvent.dispatch(ID(profile.key), profile as ProfileMemory);
  }

  // if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
  //   // TODO verify NIP05 address
  //   Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
  //     console.log('NIP05 address is valid?', isValid, profile.nip05, address);
  //     profile.nip05valid = isValid;
  //     SocialNetwork.profiles.set(id, profile);
  //     callback();
  //   });
  // }

}

const profileManager = new ProfileManager();

profileManager.init();

export default profileManager;
