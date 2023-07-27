import { memo, useEffect, useState } from 'react';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Show from '../helpers/Show';

const ProfileStats = ({ address }) => {
  const [followedUserCount, setFollowedUserCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followerCountFromApi, setFollowerCountFromApi] = useState<number>(0);
  const [followedUserCountFromApi, setFollowedUserCountFromApi] = useState<number>(0);

  useEffect(() => {
    const subscriptions = [] as any[];

    fetch(`https://eu.rbr.bio/${address}/info.json`).then((res) => {
      if (!res.ok) {
        return;
      }
      res.json().then((json) => {
        if (json) {
          setFollowedUserCountFromApi(json.following?.length);
          setFollowerCountFromApi(json.followerCount);
        }
      });
    });

    setTimeout(() => {
      subscriptions.push(
        SocialNetwork.getFollowersByUser(address, (followers) => setFollowerCount(followers.size)),
      );
      subscriptions.push(
        SocialNetwork.getFollowedByUser(address, (followed) => setFollowedUserCount(followed.size)),
      );
    }, 1000); // this causes social graph recursive loading, so let some other stuff like feed load first

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [address]);

  return (
    <div>
      <div className="text-sm flex gap-4">
        <a href={`/follows/${address}`}>
          <b>{Math.max(followedUserCount, followedUserCountFromApi)}</b> {t('following')}
        </a>
        <a href={`/followers/${address}`}>
          <b>{Math.max(followerCount, followerCountFromApi)}</b> {t('followers')}
        </a>
      </div>
      <Show when={SocialNetwork.isFollowing(address, Key.getPubKey())}>
        <div>
          <small>{t('follows_you')}</small>
        </div>
      </Show>
    </div>
  );
};

export default memo(ProfileStats);
