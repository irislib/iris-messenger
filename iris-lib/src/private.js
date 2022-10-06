import publicState from './public';
import Channel from './Channel';

const channels = new Map();

/**
 * Private channel that only you and publicKey can read/write.
 * @param publicKey
 * @returns {Channel}
 */
export default function(publicKey) {
  if (!channels.has(publicKey)) {
    channels.set(publicKey, new Channel(publicState.user(publicKey)));
  }
  return channels.get(publicKey);
}