import Node from './Node';

let local;

/**
 * Get a state that is only synced in memory and local storage
 * @returns {Node}
 */
export default function() {
  if (!local) {
    local = new Node();
  }
  return local;
}