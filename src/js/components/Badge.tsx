import { JSX } from 'preact';

import Icons from '../Icons';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

export default function Badge(props): JSX.Element | null {
  
  const myPub = Key.getPubKey();
  const hexKey = props.hexKey || Key.toNostrHexAddress(props.pub);
  if (hexKey === myPub) {
    return (
      <span class="mx-2 text-iris-blue tooltip" data-tip={t('you')}>
        {Icons.checkmark}
      </span>
    );
  }
  if (!hexKey) {
    return null;
  }
  const following = SocialNetwork.followedByUser.get(myPub)?.has(hexKey);
  if (following) {
    return (
      <span class="mx-2 text-iris-blue tooltip" data-tip={t('following')}>
        {Icons.checkmark}
      </span>
    );
  } else {
    const count = SocialNetwork.followedByFriendsCount(hexKey);
    if (count > 0) {
      const className = count > 10 ? 'text-iris-orange' : '';
      return (
        <span class={`${className} tooltip mx-2`} data-tip={`${count} ${t('friends_following')}`}>
          {Icons.checkmark}
        </span>
      );
    } else {
      return null;
    }
  }
}
