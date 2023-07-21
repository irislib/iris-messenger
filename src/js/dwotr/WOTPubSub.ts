import { Event, EventTemplate } from "nostr-tools";
import PubSub, { Unsubscribe } from "../nostr/PubSub";
import Relays from "../nostr/Relays";
import Events from "../nostr/Events";
import { EntityType } from "./Graph";
import Key from "../nostr/Key";
import SocialNetwork from "../nostr/SocialNetwork";


export type OnEvent = (
    event: Event,
    afterEose: boolean,
    url: string | undefined
) => void;

export const Trust1Kind: number = 32010;

const WOTPubSub = {

    PubSub,

    unsubs: new Map<string, Set<string>>(),


    subscribeTrust(authors: string[], since: number, cb: OnEvent): Unsubscribe {

        let relays = Relays.enabledRelays();

        let filter = {
            kinds: [Trust1Kind],
            authors,
            since, 
        }

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
            }
        );

        return unsub;
    },

    async publishTrust(pubkey: string, val: number, content: string | undefined, context: string | undefined, entityType: EntityType, timestamp?: number) {

        let to = Key.toNostrBech32Address(pubkey, "npub") as string;

        const d = `${to}|nostr`; // Specify target. [target | context]

        const event = {
            kind: Trust1Kind, // trust event kind id
            content: content || '', // The reason for the trust
            created_at: timestamp || this.getTimestamp(), // Optional, but recommended
            tags: [
                ['p', to], // Optional, but recommended
                ['d', d], // nevent, naddress, nsha256, nsha1, nsha512, nsha3, nripemd160, nmd5
                ['c', context || "nostr"], // context = nostr
                ['v', val.toString()], // 1, 0, -1
                ['t', entityType.toString()],
            ],
        }

        await this.sign(event);

        PubSub.publish(event);
    },

    async sign(event: Partial<Event>) {
        if (!event.sig) {
            await Events.sign(event as EventTemplate);
        }
        if (!(event.id && event.sig)) {
            console.error("Invalid event", event);
            throw new Error("Invalid event");
        }
    },

    getTimestamp(date: number = Date.now()) : number {
        return Math.floor(date / 1000);
    },

    // Load up profiles form the IndexedDB and subscribe to new ones
    // Makes sure we have all the known profiles in memory
    loadProfiles(
        addresses: string[],
      ): Unsubscribe {
        let missingAddresses = addresses.filter((a) => !SocialNetwork.profiles.has(a));

        let callback = (event: Event) => { 
                
            if (!event.content) return; // no content
            let existing = SocialNetwork.profiles.get(event.pubkey);
            if (existing) return; // already have it

            let profile = JSON.parse(event.content) as any;

            SocialNetwork.profiles.set(event.pubkey, profile); 
        }

        return PubSub.subscribe({ kinds: [0], authors: missingAddresses }, callback, false);
      }
}



export default WOTPubSub;