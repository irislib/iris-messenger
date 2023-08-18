import { Event, getEventHash, getSignature } from 'nostr-tools';
import PubSub, { Unsubscribe } from '../../nostr/PubSub';
import Relays from '../../nostr/Relays';
import { EdgeRecord, EntityType } from '../model/Graph';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { ID } from '../../nostr/UserIds';
import profileManager from '../ProfileManager';

export type OnEvent = (event: Event, afterEose: boolean, url: string | undefined) => void;

export const Trust1Kind: number = 32010;

export interface EntityItem {
  pubkey: string;
  entityType: EntityType;
}

class WOTPubSub {
  unsubs = new Map<string, Set<string>>();


  subscribeTrust(authors: string[] | undefined, since: number | undefined, cb: OnEvent): Unsubscribe {
    let relays = Relays.enabledRelays();

    let filter = {
      kinds: [Trust1Kind],
      authors,
      since,
    };


    const unsub = PubSub.relayPool.subscribe(
      [filter],
      relays,
      (event: Event, afterEose: boolean, url: string | undefined) => {
        setTimeout(() => {
          cb(event, afterEose, url);
        }, 0);
      },
      0,
      undefined,
      {
        // Options
        // enabled relays
        //defaultRelays,
      },
    );

    return unsub;
  }

  createTrustEventFromEdge(edge: EdgeRecord) {
    // pubkey should be in hex format
    let event = this.createTrustEvent(edge.to, edge.type, edge.note, edge.context, edge.entityType);
    return event;
  }

  createMultiEvent(
    entities: EntityItem[],
    groupKey: string,
    val: number,
    content: string = '',
    context: string = 'nostr',
    timestamp?: number,
  ) {
    // d = groupkey|v|context
    // groupkey is the usually the pubkey of the subject of the trust, but can be any string
    const d = `${groupKey}|${val.toString()}|${context}`; // Specify target. [target | value of the trust | context]

    const peTags = entities.map((e) => [e.entityType == EntityType.Key ? 'p' : 'e', e.pubkey]);

    const event = {
      kind: Trust1Kind, // trust event kind id
      content: content || '', // The reason for the trust
      created_at: timestamp || this.getTimestamp(), // Optional, but recommended
      tags: [
        ...peTags,
        ['d', d], // NIP-33 Parameterized Replaceable Events
        ['c', context], // context = nostr
        ['v', val.toString()], // 1, 0, -1
      ],
    };
    return event;
  }

  createTrustEvent(
    entityPubkey: string,
    val: number,
    content: string = '',
    context: string = 'nostr',
    entityType: EntityType = 1,
    timestamp?: number,
  ) {
    // pubkey should be in hex format

    // d = target[hex-address|'multi']|v|context
    const d = `${entityPubkey}|${val.toString()}|${context}`; // Specify target. [target | context]

    const subjectTag = entityType == EntityType.Key ? 'p' : 'e';

    const event = {
      kind: Trust1Kind, // trust event kind id
      content: content || '', // The reason for the trust
      created_at: timestamp || this.getTimestamp(), // Optional, but recommended
      tags: [
        [subjectTag, entityPubkey], // Subject
        ['d', d], // NIP-33 Parameterized Replaceable Events
        ['c', context], // context = nostr
        ['v', val.toString()], // 1, 0, -1
        //['t', entityType.toString()], // replaced by p and e tags
      ],
    };
    return event;
  }

  publishTrust(
    entityPubkey: string,
    val: number,
    content: string | undefined,
    context: string | undefined,
    entityType: EntityType,
    timestamp?: number,
  ) {
    let event = this.createTrustEvent(entityPubkey, val, content, context, entityType, timestamp);

    this.sign(event);

    console.log("Publishing trust event", event);

    PubSub.publish(event);
  }

  parseTrustEvent(event: Event) {
    let pTags: Array<string> = [];
    let eTags: Array<string> = [];
    let d: string = '';
    let context, v, note: string;
    let authorPubkey = event.pubkey;
    let timestamp = event.created_at;

    if (event.tags) {
      for (const tag of event.tags) {
        switch (tag[0]) {
          case 'p':
            pTags.push(tag[1]);
            break;
          case 'e':
            eTags.push(tag[1]);
            break;
          case 'c':
            context = tag[1];
            break;
          case 'd':
            d = tag[1];
            break;
          case 'v':
            v = tag[1];
            break;
        }
      }
    }
    note = event.content;

    let val = parseInt(v);
    if (isNaN(val) || val < -1 || val > 1) val = 0; // Invalid value, the default to 0

    return { pTags, eTags, context, d, v, val, note, authorPubkey, timestamp };
  }

  sign(event: Partial<Event>) {
    if (!event.sig) {
        if (!event.tags) {
          event.tags = [];
        }
        event.content = event.content || '';
        event.created_at = event.created_at || Math.floor(Date.now() / 1000);
        event.pubkey = Key.getPubKey();
        event.id = getEventHash(event as Event);
        event.sig = getSignature(event as Event, Key.getPrivKey());
    }
    if (!(event.id && event.sig)) {
      console.error('Invalid event', event);
      throw new Error('Invalid event');
    }
  }

  getTimestamp(date: number = Date.now()): number {
    return Math.floor(date / 1000);
  }

  // // Load up profiles form the IndexedDB and subscribe to new ones
  // // Makes sure we have all the known profiles in memory
  // loadProfiles(addresses: string[]): Unsubscribe {
  //   let missingAddresses = addresses.filter((a) => !SocialNetwork.profiles.has(ID(a)));

  //   let callback = (event: Event) => {
  //     if (!event.content) return; // no content
  //     let existing = SocialNetwork.profiles.get(ID(event.pubkey));
  //     if (existing) return; // already have it

  //     let profile = JSON.parse(event.content) as any;

  //     profileManager.addProfileToMemory(profile);
  //   };

  //   return PubSub.subscribe({ kinds: [0], authors: missingAddresses }, callback, false);
  // }
}

const wotPubSub = new WOTPubSub();

export default wotPubSub;
