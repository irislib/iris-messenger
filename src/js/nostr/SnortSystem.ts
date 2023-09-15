import {
  EventPublisher,
  NoopStore,
  NostrSystem,
  RequestBuilder,
  UserRelaysCache,
} from '@snort/system';
import { Event, Filter } from 'nostr-tools';

// Provided in-memory / indexedDb cache for relays
// You can also implement your own with "RelayCache" interface
const RelaysCache = new UserRelaysCache();

// example auth handler using NIP-07
const AuthHandler = async (challenge: string, relay: string) => {
  const pub = await EventPublisher.nip7();
  if (pub) {
    return await pub.nip42Auth(challenge, relay);
  }
};

// Singleton instance to store all connections and access query fetching system
const System = new NostrSystem({
  relayCache: RelaysCache,
  authHandler: AuthHandler, // can be left undefined if you dont care about NIP-42 Auth
});

const connect = System.ConnectToRelay('wss://relay.snort.social', { read: true, write: false });

const publish = async (event: Event) => {
  await connect;
};

const subscribe = async (filter: Filter, callback: (event: Event) => void) => {
  await connect;
  const rb = new RequestBuilder('no id');

  rb.withBareFilter(filter);

  const q = System.Query<NoopStore>(NoopStore, rb);
  // basic usage using "onEvent", fired for every event added to the store
  q.feed.onEvent((events) => {
    events.forEach((event) => {
      callback(event);
    });
  });
};

export default {
  publish,
  subscribe,
};
