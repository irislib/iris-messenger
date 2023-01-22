const { Path, getEventHash, signEvent, generatePrivateKey, getPublicKey } = require('./lib/nostr.cjs')

test('first set, then get', () => {
  const privkey = generatePrivateKey();
  const pubkey = getPublicKey(privkey);
  const created_at = Math.floor(Date.now() / 1000);
  const publish = async (incompleteEvent) => {
    const event = Object.assign({ pubkey, created_at }, incompleteEvent);
    event.id = getEventHash(event);
    event.sig = signEvent(event, privkey);
    return event;
  };
  const subscribe = jest.fn();
  const unsubscribe = jest.fn();
  const callback = (entry) => {
    expect(entry).toEqual({ author: pubkey, path: 'hello', value: 'world', created_at });
  };

  const path = new Path(publish, subscribe, unsubscribe);
  path.set('hello', 'world');
  path.get({ path: 'hello' }, callback);
});

test('first get, then set', () => {
  const privkey = generatePrivateKey();
  const pubkey = getPublicKey(privkey);
  const created_at = Math.floor(Date.now() / 1000);
  const publish = async (incompleteEvent) => {
    const event = Object.assign({ pubkey, created_at }, incompleteEvent);
    event.id = getEventHash(event);
    event.sig = signEvent(event, privkey);
    return event;
  };
  const subscribe = jest.fn();
  const unsubscribe = jest.fn();
  const callback = (entry) => {
    expect(entry).toEqual({ author: pubkey, path: 'hello', value: 'world', created_at });
  };

  const path = new Path(publish, subscribe, unsubscribe);
  path.get({ path: 'hello' }, callback);
  path.set('hello', 'world');
});