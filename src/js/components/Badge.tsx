import Icons from '../Icons';
import Nostr from '../nostr/Nostr';
import { translate as t } from '../translations/Translation';

export default function Badge(props) {
  const myPub = Nostr.getPubKey();
  const hexAddress = Nostr.toNostrHexAddress(props.pub);
  if (hexAddress === myPub) {
    return (
      <span class="badge first tooltip">
        {Icons.checkmark}
        <span class="tooltiptext right">{t('you')}</span>
      </span>
    );
  }
  if (!hexAddress) {
    return null;
  }
  const following = Nostr.followedByUser.get(myPub)?.has(hexAddress);
  if (following) {
    return (
      <span class="badge first tooltip">
        {Icons.checkmark}
        <span class="tooltiptext right">{t('following')}</span>
      </span>
    );
  } else {
    const count = Nostr.followedByFriendsCount(hexAddress);
    if (count > 0) {
      const className = count > 10 ? 'second' : 'third';
      return (
        <span class={`badge ${className} tooltip`}>
          {Icons.checkmark}
          <span class="tooltiptext right">
            {count} {t('friends_following')}
          </span>
        </span>
      );
    }
  }
}
