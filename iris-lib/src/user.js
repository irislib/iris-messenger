import publicState from './public';
import session from './session';

/**
 * Get a user space where only the user can write. Others can read.
 * @param pub
 * @returns {Node} The user space.
 */
export default function(pub) {
  const user = publicState().user(pub);
  if (!pub && !user._.root.user.is) { // better way to check if user is logged in?
    console.log('auth');
    user.auth(session.getKey());
  }

  return user;
}
