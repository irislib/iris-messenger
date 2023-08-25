import { RelayPool } from 'nostr-relaypool';

import Events from '@/nostr/Events.ts';
import Relays from '@/nostr/Relays.ts';
import localState from '@/state/LocalState.ts';
import { UniqueIds } from '@/utils/UniqueIds.ts';

let relayPoolInstance: RelayPool | null = null;

let isListenerAdded = false;

const getRelayPool = () => {
  if (relayPoolInstance) {
    return relayPoolInstance;
  }

  let dev = {
    logSubscriptions: false,
    indexedDbLoad: true,
  };

  let lastResubscribed = Date.now();

  localState.get('dev').on((d) => {
    dev = d;
    relayPoolInstance!.logSubscriptions = dev.logSubscriptions;
  });

  const reconnect = () => {
    if (Date.now() - lastResubscribed > 60 * 1000) {
      lastResubscribed = Date.now();
      relayPoolInstance!.reconnect();
    }
  };

  if (!isListenerAdded) {
    isListenerAdded = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        reconnect();
      }
    });
    document.addEventListener('online', reconnect);
  }

  relayPoolInstance = new RelayPool(Relays.enabledRelays(), {
    useEventCache: false,
    autoReconnect: true,
    externalGetEventById: (id) => {
      return (
        (UniqueIds.has(id) && {
          sig: '',
          id: '',
          kind: 0,
          tags: [],
          content: '',
          created_at: 0,
          pubkey: '',
        }) ||
        undefined
      );
    },
  });

  const compareUrls = (a: string, b: string): boolean => {
    return new URL(a).host === new URL(b).host;
  };

  relayPoolInstance.onauth(async (relay, challenge) => {
    if (!Relays.enabledRelays().some((r) => compareUrls(r, relay.url))) {
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await authenticate({ relay, challenge, sign: Events.sign });
    } catch (e) {
      console.log('error: authenticate to relay:', e);
      relayPoolInstance!.removeRelay(relay.url);
      Relays.disable(relay.url);
    }
  });

  return relayPoolInstance;
};

export default getRelayPool;
