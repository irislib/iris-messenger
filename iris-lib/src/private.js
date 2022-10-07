import Channel from './Channel';
import session from './session';

const channels = new Map();

/**
 * Private channel that only you and publicKey can read/write.
 * @param publicKey
 * @returns {Channel}
 */
export default function(publicKey = session.getKey(), chatLink) {
  if (!channels.has(publicKey)) {
    channels.set(publicKey, new Channel({participants: publicKey, chatLink}));
  }
  return channels.get(publicKey);
}