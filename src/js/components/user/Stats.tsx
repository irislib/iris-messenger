import { memo, useCallback, useEffect, useState } from 'react';
import throttle from 'lodash/throttle';
import { Link } from 'preact-router';

import { ID, STR } from '@/utils/UniqueIds.ts';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Show from '../helpers/Show';

import Name from './Name';

const ProfileStats = ({ address }) => {
  const [followedUserCount, setFollowedUserCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followerCountFromApi, setFollowerCountFromApi] = useState<number>(0);
  const [followedUserCountFromApi, setFollowedUserCountFromApi] = useState<number>(0);
  const isMyProfile = Key.isMine(address);

  const getKnownFollowers = useCallback(() => {
    const followerSet = SocialNetwork.followersByUser.get(ID(address));
    const followers = Array.from(followerSet || new Set<number>());
    return followers
      ?.filter((id) => typeof id === 'number' && SocialNetwork.followDistanceByUser.get(id) === 1)
      .map((id) => STR(id));
  }, []);

  const [knownFollowers, setKnownFollowers] = useState<string[]>(getKnownFollowers());

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`https://eu.rbr.bio/${address}/info.json`);
      if (!res.ok) {
        return;
      }
      const json = await res.json();
      if (json) {
        setFollowedUserCountFromApi(json.following?.length);
        setFollowerCountFromApi(json.followerCount);
      }
    };

    fetchData();

    const throttledSetKnownFollowers = throttle(() => {
      setKnownFollowers(getKnownFollowers());
    }, 1000);

    const subscriptions = [
      SocialNetwork.getFollowersByUser(address, (followers: Set<string>) => {
        setFollowerCount(followers.size);
        throttledSetKnownFollowers();
      }),
      SocialNetwork.getFollowedByUser(address, (followed) => setFollowedUserCount(followed.size)),
    ];

    setTimeout(() => subscriptions.forEach((sub) => sub()), 1000);

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [address, getKnownFollowers]);

  return (
    <div>
      <div className="text-sm flex gap-4">
        <Link href={`/follows/${address}`}>
          <b>{Math.max(followedUserCount, followedUserCountFromApi)}</b> {t('following')}
        </Link>
        <Link href={`/followers/${address}`}>
          <b>{Math.max(followerCount, followerCountFromApi)}</b> {t('followers')}
        </Link>
      </div>
      <Show when={!isMyProfile && knownFollowers.length > 0}>
        <div className="text-neutral-500">
          <small>
            Followed by{' '}
            {knownFollowers.slice(0, 3).map((follower, index) => (
              <span key={follower}>
                <Show when={index > 0}>{', '}</Show>
                <Link
                  className="hover:underline"
                  href={`/${Key.toNostrBech32Address(follower, 'npub')}`}
                >
                  <Name pub={follower} hideBadge={true} />
                </Link>{' '}
              </span>
            ))}
            <Show when={knownFollowers.length > 3}>
              <span>
                {' '}
                and <b>{knownFollowers.length - 3}</b> other users you follow
              </span>
            </Show>
          </small>
        </div>
      </Show>
      <Show when={SocialNetwork.isFollowing(address, Key.getPubKey())}>
        <div className="text-neutral-500">
          <small>{t('follows_you')}</small>
        </div>
      </Show>
    </div>
  );
};

export default memo(ProfileStats);
