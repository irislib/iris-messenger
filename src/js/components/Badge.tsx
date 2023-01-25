import iris from 'iris-lib';

import Icons from '../Icons';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

export default function Badge(props) {
  const myPub = iris.session.getKey().secp256k1.rpub;
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
      return (
        <span className="badge second tooltip">
          {Icons.checkmark}
          <span class="tooltiptext right">
            {count} {t('friends_following')}
          </span>
        </span>
      );
    }
  }
}
