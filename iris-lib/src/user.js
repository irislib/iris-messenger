import publicState from './public';

/**
 * Get a user space where only the user can write. Others can read.
 * @param pub
 * @returns gun user node
 */
export default function(pub) {
  return publicState().user(pub);
}
