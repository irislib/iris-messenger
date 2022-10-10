import publicState from './public';
import session from './session';

/**
 * Get a user space where only the user can write. Others can read.
 * @param pub
 * @returns {Node} The user space.
 */

let currentUser;

export default function(pub) {
  if (!currentUser) {
    currentUser = publicState().user();
    currentUser.auth(session.getKey());
  }
  return pub ? publicState().user(pub) : currentUser;
}
