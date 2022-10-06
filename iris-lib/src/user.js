import publicState from './public';

/**
 *
 * @param pub
 * @returns gun user node
 */
export default function(pub) {
  return publicState().user(pub);
}
