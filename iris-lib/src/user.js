import publicState from './public';

/**
 * Get a user space where only the user can write. Others can read.
 * @param pub
 * @returns {Node} The user space.
 */
export default function(pub) {
  return publicState().user(pub);
}
