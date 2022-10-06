import Node from './Node';

let local;

/**
 * Get the local state
 * @returns {Node}
 */
export default function() {
  if (!local) {
    local = new Node();
  }
  return local;
}