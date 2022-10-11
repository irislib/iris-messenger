import Channel from './Channel';
import session from './session';

const channels = new Map<string, Channel>();

/**
 * Private channel that only you and publicKey can read/write.
 * @param publicKey
 * @returns {Channel}
 */
export default function(publicKey = session.getKey(), chatLink?: string): Channel {
  let channel = channels.get(publicKey);
  if (!channel) {
    channel = new Channel({participants: publicKey, chatLink})
    channels.set(publicKey, channel);
  }
  return channel;
}