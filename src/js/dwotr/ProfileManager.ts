import { Event } from 'nostr-tools';
import Events from '../nostr/Events';
import IndexedDB from '../nostr/IndexedDB';
import PubSub, { Unsubscribe } from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { ID, PUB } from '../nostr/UserIds';
import Key from '../nostr/Key';
import FuzzySearch from '../FuzzySearch';
import ProfileRecord, { ProfileMemory } from './model/ProfileRecord';
import { throttle } from 'lodash';
import Identicon from 'identicon.js';
import OneCallQueue from './Utils/OneCallQueue';
import storage from './Storage';
import { hexName } from './Utils';
import { ProfileEvent } from './network/ProfileEvent';

class ProfileManager {
  loaded: boolean = false;
  #saveQueue: ProfileRecord[] = [];
  #saving: boolean = false;
  prefixHistory: string = '';
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
    // this.history[hexPub] = this.history[hexPub] || [];

    // let profile = SocialNetwork.profiles.get(ID(hexPub));
    // let prefix = '';

    // if (this.prefixHistory) prefix = this.prefixHistory + ' -> ';

    // let event = {
    //   name: prefix + name,
    //   isProfileLoaded: profile != undefined,
    //   time: Date.now(),
    // };
    // this.history[hexPub].push(event);
    this.prefixHistory = '';
  }

  async fetchProfile(hexPub: string) {
    try {
      this.recordHistory(hexPub, 'fetchProfile');

      let url = `https://api.iris.to/profile/${hexPub}`;

      let { data } = await OneCallQueue<any>(url, async () => {
        // Fetch the resource and return the response body as a JSON object
        let res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        if (res && res.status === 200) {
          let data = await res.json();
          this.recordHistory(hexPub, 'fetchProfile->Dataloaded');
          return { res, data };
        }
        return { res, data: undefined };
      });

      return data;
    } catch (error: any) {
      console.log('There was a problem with the fetch operation: ' + error.message);
    }
  }

  async loadProfiles(addresses: Set<string>): Promise<ProfileRecord[]> {
    return await storage.profiles.where('key').anyOf(Array.from(addresses)).toArray();
  }

  async loadProfile(hexPub: string): Promise<ProfileRecord | undefined> {
    this.recordHistory(hexPub, 'loadProfile');

    let profile = await OneCallQueue<ProfileRecord>(`loadProfile${hexPub}`, async () => {
      this.recordHistory(hexPub, 'loadProfile->Storage loading data now');
      return storage.profiles.get({ key: hexPub });
    });

    this.recordHistory(hexPub, 'loadProfile->Dataloaded');
    if (profile?.isDefault) {
      this.recordHistory(hexPub, 'Dataloaded with default profile :(');
      return undefined;
    }

    return profile;
  }

  // getProfile(
  //   address: string,
  //   cb?: (profile: any, address: string) => void,
  //   verifyNip05 = false,
  // ): Unsubscribe {
  //   const hexPub = Key.toNostrHexAddress(address) as string;
  //   const id = ID(hexPub);

  //   this.prefixHistory = 'getProfile';

  //   const callback = () => {
  //     cb?.(SocialNetwork.profiles.get(id), hexPub);
  //   };

  //   let profile = SocialNetwork.profiles.get(id);

  //   if (profile && !profile.isDefault) {
  //     callback();
  //     if (verifyNip05 && profile.nip05 && !profile.nip05valid) {
  //       // TODO verify NIP05 address
  //       Key.verifyNip05Address(profile.nip05, address).then((isValid) => {
  //         console.log('NIP05 address is valid?', isValid, profile.nip05, address);
  //         profile.nip05valid = isValid;

  //         this.dispatchProfile(profile);
  //         //SocialNetwork.profiles.set(id, profile);
  //         callback();
  //       });
  //     }
  //   } else {
  //     // Check if profile is in IndexedDB
  //     this.loadProfile(hexPub).then((profile) => {
  //       if (profile) {
  //         // exists in DB
  //         if (this.isProfileNewer(profile)) this.addProfileToMemory(profile);

  //         callback(); // callback with profile
  //       } else {
  //         // Check if profile is in API
  //         profileManager.fetchProfile(hexPub).then((profile) => {
  //           if (!profile) return; // not in API
  //           // TODO verify sig
  //           if (this.isProfileNewer(profile))
  //             // but is it newer?
  //             this.prefixHistory = 'getProfile->fetchProfile->isProfileNewer';
  //           this.addProfileEvent(profile);

  //           callback();
  //         });
  //         return;
  //       }
  //     });
  //   }

  //   if (profile && profile.isDefault) {
  //     callback();
  //   }

  //   if (!profile) {
  //     profile = this.createDefaultProfile(hexPub);
  //     SocialNetwork.profiles.set(id, profile);
  //     callback();
  //   }

  //   // Then subscribe to updates via nostr relays
  //   return PubSub.subscribe({ kinds: [0], authors: [hexPub] }, callback, false);
  // }

  async getProfiles(
    addresses: string[],
  ): Promise<{ unsub: Unsubscribe; profiles: Array<ProfileRecord> }> {
    //
    if (!addresses || addresses.length === 0) return { unsub: () => {}, profiles: [] };

    let profiles: Array<any> = [];
    let dbLookups: Array<string> = [];
    let authors: Array<string> = [];

    // First load from memory
    for (const address of addresses) {
      if (!address) continue;
      const hexPub = Key.toNostrHexAddress(address) as string;
      const profile = SocialNetwork.profiles.get(ID(hexPub)); // ID() makes sure to register the address with an ID in the UserIds map if it's not already there
      if (profile) {
        profiles.push(profile);
      } else {
        dbLookups.push(hexPub);
      }

      authors.push(hexPub);
    }

    if (dbLookups.length > 0) {
      let lookupSet = new Set(dbLookups);

      // Then load from DB
      const dbProfiles = await this.loadProfiles(lookupSet);

      if (dbProfiles && dbProfiles.length > 0) {
        profiles = profiles.concat(dbProfiles);
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
              profiles.push(profile);
              lookupSet.delete(profile.key);
            }
          }
        }
      }

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

    // Then subscribe to updates via nostr relays
    let unsub = PubSub.subscribe({ kinds: [0], authors }, this.subscriptionCallback, false);
    return { unsub, profiles };
  }

  saveProfile(profile: ProfileRecord) {
    if (!profile?.isDefault) return; // don't save default profiles
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
    let display_name = p.display_name || p.displayName;

    // Make sure that we don't store large values
    display_name = p.display_name?.trim().slice(0, 200);
    let about = p.about.trim().slice(0, 10000);
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

  getDefaultProfile(id: number | undefined) {
    if (!id) return undefined;
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(PUB(id));
  }

  quickProfile(address: string) {
    const id = ID(address);
    const profile = SocialNetwork.profiles.get(id);
    if (profile) return profile;
    return this.createDefaultProfile(PUB(id));
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

      //Always save the profile to DWoTRDB
      this.saveProfile(profile); // Save to DWoTRDB

      this.prefixHistory = 'addProfileEvent';
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
    profileManager.recordHistory(event.pubkey, 'subscriptionCallback');
    let profile = SocialNetwork.profiles.get(ID(event.pubkey));
    profileManager.dispatchProfile(profile);
  }

  subscribe(address: string): Unsubscribe {
    const hexPub = Key.toNostrHexAddress(address) as string;
    const id = ID(hexPub);

    let profile = SocialNetwork.profiles.get(id);

    if (!profile || profile.isDefault) {
      // Check if profile is in IndexedDB
      this.prefixHistory = 'subscribe()';
      this.loadProfile(hexPub).then((profile) => {
        if (profile) {
          // exists in DB
          this.prefixHistory = 'subscribe() -> loadProfile()';
          this.dispatchProfile(profile);
        } else {
          // Check if profile is in API
          this.prefixHistory = 'subscribe()';
          profileManager.fetchProfile(hexPub).then((data) => {
            // TODO verify sig
            if (!data) return;

            this.prefixHistory = 'subscribe() -> fetchProfile() -> addProfileEvent()';
            let profile = this.addProfileEvent(data);
            if (!profile) return;

            this.prefixHistory = 'subscribe() -> fetchProfile() -> dispatchProfileIfNewer()';
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

    this.prefixHistory += 'dispatchProfileIfNewer()';

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
  getMemoryProfile(id: number) : ProfileRecord {
    const profile = SocialNetwork.profiles.get(id);

    if (profile) return profile;
    return this.createDefaultProfile(PUB(id));
  }
}

const profileManager = new ProfileManager();

profileManager.init();

export default profileManager;
