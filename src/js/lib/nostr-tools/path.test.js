const { Path, signEvent, generatePrivateKey, getPublicKey } = require('./lib/nostr.cjs')

test('set & get', () => {
  const privkey = generatePrivateKey();
  const pubkey = getPublicKey(privkey);
  const publish = (incompleteEvent) => {
    const event = Object.assign({ pubkey }, incompleteEvent);
    return signEvent(event, privkey);
  };
  const subscribe = jest.fn();
  const unsubscribe = jest.fn();

  const path = new Path(publish, subscribe, unsubscribe);
  const callback = jest.fn();
  path.get({ path: 'hello' }, callback);
  path.set('hello', 'world');
  expect(callback).toHaveBeenCalledWith({ path: 'hello', value: 'world', author: pubkey });
});