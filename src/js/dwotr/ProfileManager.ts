import { Event } from 'nostr-tools';
import AnimalName from '../AnimalName';
import Events from '../nostr/Events';
import IndexedDB from '../nostr/IndexedDB';
import PubSub, { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { BECH32, ID } from '../nostr/UserIds';
import Key from '../nostr/Key';
import FuzzySearch from '../FuzzySearch';
import ProfileRecord from './model/ProfileRecord';
import { throttle } from 'lodash';
import Identicon from 'identicon.js';
import OneCallQueue from './Utils/OneCallQueue';
import storage from './Storage';
import { ProfileEvent } from './hooks/useProfile';

class ProfileManager {
  loaded: boolean = false;
  #saveQueue: ProfileRecord[] = [];
  #saving: boolean = false;
  prefixHistory: string = "";
  history: { [key: string]: any } = {};

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

  recordHistory(hexPub: string, name: string) {
    this.history[hexPub] = this.history[hexPub] || [];

    let profile = SocialNetwork.profiles.get(ID(hexPub));
    let prefix =""
    
    if(this.prefixHistory)
      prefix = this.prefixHistory + " -> ";

    let event = {
       name: prefix+name,
       isProfileLoaded: profile != undefined,
       time: Date.now(),
    }
    this.history[hexPub].push(event);
    this.prefixHistory = "";
  }

  async fetchProfile(hexPub: string) {
    try {
      // Make sure that we only call this once per pub
      // if (this.#urlcallindex[hexPub]) return undefined;
      // this.#urlcallindex[hexPub] = true;

      // if (hexPub == 'baf27a4cc4da49913e7fdecc951fd3b971c9279959af62b02b761a043c33384c') {
      //   console.log('fetchProfile', hexPub, this.#counter++);
      // }
      this.recordHistory(hexPub, 'fetchProfile');

      let url = `https://api.iris.to/profile/${hexPub}`;

      // let res = await OneCallQueue<any>(url, async () => fetch(url));
      let res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (res && res.status === 200) {
        //console.log('fetchProfile success', npub);
        let data = await res.json();
        this.recordHistory(hexPub, 'fetchProfile->Dataloaded');
        return data;
      }

      //console.log('fetchProfile failed', npub, res.status, res.statusText);
      return undefined;
    } catch (error: any) {
      console.log('There was a problem with the fetch operation: ' + error.message);
    }
  }

  getProfile(
    address: string,
    cb?: (profile: any, address: string) => void,
    verifyNip05 = false,
  ): Unsubscribe {
    const hexPub = Key.toNostrHexAddress(address) as string;
    const npub = Key.toNostrBech32Address(address, 'npub') as string;
    const id = ID(hexPub);

    this.prefixHistory = "getProfile";

    const callback = () => {
      cb?.(SocialNetwork.profiles.get(id), hexPub);
    };

    let profile = SocialNetwork.profiles.get(id);

    if (profile && !profile.isDefault) {
      callback();
      if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
        // TODO verify NIP05 address
        Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
          console.log('NIP05 address is valid?', isValid, profile.nip05, address);
          profile.nip05valid = isValid;
          SocialNetwork.profiles.set(id, profile);
          callback();
        });
      }
    } else {
      // Check if profile is in IndexedDB
      this.loadProfile(hexPub).then((profile) => {
        if (profile) {
          // exists in DB
          if (this.isProfileNewer(profile)) this.addProfileToMemory(profile);

          callback(); // callback with profile
        } else {
          // Check if profile is in API
          profileManager.fetchProfile(hexPub).then((profile) => {
            if (!profile) return; // not in API
            // TODO verify sig
            if (this.isProfileNewer(profile))
              // but is it newer?
              this.prefixHistory = "getProfile->fetchProfile->isProfileNewer"
              this.addProfileEvent(profile);

            callback();
          });
          return;
        }
      });
    }

    if (profile && profile.isDefault) {
      callback();
    }

    if (!profile) {
      profile = this.createDefaultProfile(npub);
      SocialNetwork.profiles.set(id, profile);
      callback();
    }

    // Then subscribe to updates via nostr relays
    return PubSub.subscribe({ kinds: [0], authors: [hexPub] }, callback, false);
  }

  async getProfiles(
    addresses: string[],
    cb?: (profiles: Array<any>) => void,
  ): Promise<Unsubscribe> {
    if (!addresses || addresses.length === 0) return () => {};

    let result: Array<any> = [];
    let dbLookups: Array<string> = [];
    let authors: Array<string> = [];

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

      authors.push(hexPub);
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
          this.fetchProfile(Key.toNostrHexAddress(address) as string),
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

    // Then save to memory
    for (const profile of result) {
      if (!profile || !this.isProfileNewer(profile)) continue;

      this.addProfileToMemory(profile);
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

    return PubSub.subscribe({ kinds: [0], authors }, callback, false);
  }

  async loadProfiles(addresses: Set<string>): Promise<ProfileRecord[]> {
    return await storage.profiles.where('key').anyOf(Array.from(addresses)).toArray();
    // if (!list) return undefined;
    // const profiles = list.map((p) => this.addProfileToMemory(p));
    // return profiles;
  }

  async loadProfile(hexPub: string): Promise<ProfileRecord | undefined> {
    // Make sure that we only call this once per pub
    // if (this.#dbcallindex[hexPub]) return undefined;
    // this.#dbcallindex[hexPub] = true;

    // if (hexPub == 'baf27a4cc4da49913e7fdecc951fd3b971c9279959af62b02b761a043c33384c') {
    //   console.log('fetchProfile', hexPub, this.#counter++);
    // }
    this.recordHistory(hexPub, 'loadProfile');

    let profile = await OneCallQueue<ProfileRecord>(`loadProfile${hexPub}`, 
    async () => {
      this.recordHistory(hexPub, 'loadProfile->Storage loading data now');
      return storage.profiles.get({ key: hexPub });
      }
    );
    this.recordHistory(hexPub, 'loadProfile->Dataloaded');

    return profile;
  }

  saveProfile(profile: ProfileRecord) {
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
      //displayName: display_name,
      display_name,
      picture,
      isDefault,
    } as ProfileRecord;

    return profile;
  }

  createDefaultProfile(npub: string): ProfileRecord {
    let profile = this.sanitizeProfile({}, npub);
    return profile;
  }

  getDefaultProfile(id: number | undefined) {
    if (!id) return undefined;
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(BECH32(id));
  }

  quickProfile(address: string) {
    const id = ID(address);
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(BECH32(id));
  }

  isProfileNewer(profile: ProfileRecord) {
    if (!profile || !profile.key) return false;
    const existingProfile = SocialNetwork.profiles.get(ID(profile.key));
    if (existingProfile) {
      if (profile.created_at <= existingProfile.created_at) return false;
    }
    return true;
  }

  addProfileToMemory(profile: ProfileRecord) {
    if (!profile) return undefined;

    this.recordHistory(profile.key, 'addProfileToMemory');
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

    this.recordHistory(event.pubkey, 'addProfileEvent');

    try {
      const raw = JSON.parse(event.content);
      if (!raw) return undefined;

      raw.created_at = event.created_at; // Add the event timestamp to the profile

      let profile = this.sanitizeProfile(raw, event.pubkey);

      if (!this.isProfileNewer(profile)) return undefined;

      this.saveProfile(profile); // Save to DWoTRDB

      this.prefixHistory = "addProfileEvent";
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

  // load(hexPub: string) {
  //   this.loadProfile(hexPub).then((profile) => {
  //     if (profile) {
  //       // exists in DB
  //       this.dispatchProfileIfNewer(profile);
  //     } else {
  //       // Check if profile is in API
  //       profileManager.fetchProfile(hexPub).then((data) => {
  //         // TODO verify sig
  //         if (!data) return;

  //         let profile = this.addProfileEvent(data);
  //         if (!profile) return;

  //         this.dispatchProfileIfNewer(profile as ProfileRecord);
  //       });
  //     }
  //   });
  // }


   subscriptionCallback(event: Event) {

    this.recordHistory(event.pubkey, 'subscriptionCallback');
    let profile = SocialNetwork.profiles.get(ID(event.pubkey));
    profileManager.dispatchProfileIfNewer(profile);
  };


  subscribe(address: string) : void {
    const hexPub = Key.toNostrHexAddress(address) as string;
    const id = ID(hexPub);

    let profile = SocialNetwork.profiles.get(id);

    if (!profile || profile.isDefault) {
      // Check if profile is in IndexedDB
      this.prefixHistory ="subscribe()";
      this.loadProfile(hexPub).then((profile) => {
        if (profile) {
          // exists in DB
          this.prefixHistory ="subscribe() -> loadProfile()";
          this.dispatchProfileIfNewer(profile);
        } else {
          // Check if profile is in API
          this.prefixHistory ="subscribe()";
          profileManager.fetchProfile(hexPub).then((data) => {
            // TODO verify sig
            if (!data) return;

            this.prefixHistory = "subscribe() -> fetchProfile() -> addProfileEvent()";
            let profile = this.addProfileEvent(data);
            if (!profile) return;

            this.prefixHistory = "subscribe() -> fetchProfile() -> dispatchProfileIfNewer()";
            this.dispatchProfileIfNewer(profile as ProfileRecord);
          });
        }
      });
    }

    if (this.subscriptions.has(hexPub)) return;

    this.recordHistory(hexPub, 'subscribe to nostr');

    // Then subscribe to updates via nostr relays
    let unsub = PubSub.subscribe({ kinds: [0], authors: [hexPub] }, this.subscriptionCallback, false);
    this.subscriptions.set(hexPub, unsub);
  }

  unsubscribe(address: string) {
    this.recordHistory(address, 'unsubscribe');
    
    const unsub = this.subscriptions.get(Key.toNostrHexAddress(address) as string);
    unsub?.();
  }

  dispatchProfileIfNewer(profile: ProfileRecord) {
    if (!profile) return;
    if (!this.isProfileNewer(profile)) return;
    this.prefixHistory += "dispatchProfileIfNewer()";
    this.addProfileToMemory(profile);

    this.dispatchProfile(profile);
  }

  dispatchProfile(profile: ProfileRecord) {
    let event = new ProfileEvent(ID(profile.key), profile);
    window.dispatchEvent(event);
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
  getCurrentProfile(id: number | undefined) {
    if (!id) return undefined;
    const profile = SocialNetwork.profiles.get(id);

    if (profile) return profile;
    return this.createDefaultProfile(BECH32(id));
  }
}

const profileManager = new ProfileManager();

profileManager.init();

export default profileManager;
