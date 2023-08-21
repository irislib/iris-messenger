import { JSX } from 'preact';

import { useKey } from '@/hooks/useKey';

import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Icons from '../../utils/Icons';

export default function Badge(props): JSX.Element | null {
  const { hexKey, isMe, myPubKey } = useKey(props.pub);
  
  if(!props.pub) return null; // If no pub key, don't render anything

  if (isMe) {
    return (
      <span class="mx-2 text-iris-blue tooltip" data-tip={t('you')}>
        {Icons.checkmark}
      </span>
    );
  }

  const following = SocialNetwork.isFollowing(myPubKey, hexKey);
  if (following) {
    return (
      <span class="ml-2 text-iris-blue tooltip" data-tip={t('following')}>
        {Icons.checkmark}
      </span>
    );
  } else {
    const count = SocialNetwork.followedByFriendsCount(hexKey);
    if (count > 0) {
      const className = count > 10 ? 'text-iris-orange' : '';
      return (
        <span class={`${className} tooltip ml-2`} data-tip={`${count} ${t('friends_following')}`}>
          {Icons.checkmark}
        </span>
      );
    } else {
      return null;
    }
  }
}
