import Events from '@/nostr/Events';
import Key from '@/nostr/Key';
import PubSub from '@/nostr/PubSub';
import { Adapter, Callback, NodeValue, Unsubscribe } from '@/state/types.ts';

export default class IrisNostrAdapter extends Adapter {
  seenValues = new Map<string, NodeValue>();

  get(path: string, callback: Callback): Unsubscribe {
    const unsubObj = { fn: null as any };

    unsubObj.fn = PubSub.subscribe(
      // @ts-ignore
      { authors: [Key.getPubKey()], kinds: [30000], '#d': [path] },
      (event) => {
        callback(JSON.parse(event.content), path, event.created_at * 1000, () => unsubObj.fn());
      },
    );
    return () => unsubObj.fn();
  }

  async set(path: string, value: NodeValue) {
    if (value && value.updatedAt === undefined) {
      throw new Error(`Invalid value: ${JSON.stringify(value)}`);
    }

    const seen = this.seenValues.get(path);
    if (seen && seen.updatedAt <= value.updatedAt) {
      return;
    }
    this.seenValues.set(path, value);

    console.log('set state', path, value);

    const directory = path.split('/').slice(0, -1).join('/');
    const e = await Events.publish({
      // @ts-ignore
      kind: 30000,
      content: JSON.stringify(value.value),
      created_at: Math.ceil(value.updatedAt / 1000),
      tags: [
        ['d', path],
        ['f', directory],
      ],
    });
    console.log('published state event', e);
  }

  list(path: string, callback: Callback): Unsubscribe {
    const unsubObj = { fn: null as any };

    unsubObj.fn = PubSub.subscribe(
      // @ts-ignore
      { authors: [Key.getPubKey()], kinds: [30000] },
      (event) => {
        const childPath = event.tags.find((tag) => {
          if (tag[0] === 'd') {
            const remainingPath = tag[1].replace(`${path}/`, '');
            if (
              remainingPath.length &&
              tag[1].startsWith(`${path}/`) &&
              !remainingPath.includes('/')
            ) {
              return true;
            }
          }
        })?.[1];

        if (childPath) {
          callback(JSON.parse(event.content), childPath, event.created_at * 1000, () =>
            unsubObj.fn(),
          );
        }
      },
    );
    return () => unsubObj.fn();
  }
}
