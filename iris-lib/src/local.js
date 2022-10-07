import Node from './Node';

let local;

/**
 * Get a state that is only synced in memory and local storage.
 *
 * Useful for storing things like UI state, local indexes or logged in user.
 * @returns {Node}
 */
export default function() {
  if (!local) {
    local = new Node();
  }
  return local;
}