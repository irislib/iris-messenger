import { memo, useEffect, useState } from 'react';
import throttle from 'lodash/throttle';
import { Link } from 'preact-router';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Show from '../helpers/Show';

import Name from './Name';
import ProfileScoreLinks from '../../dwotr/components/ProfileScoreLinks';

const ProfileStats = ({ address }) => {
  const [followedUserCount, setFollowedUserCount] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followerCountFromApi, setFollowerCountFromApi] = useState<number>(0);
  const [followedUserCountFromApi, setFollowedUserCountFromApi] = useState<number>(0);
  const [knownFollowers, setKnownFollowers] = useState<string[]>([]);
  const isMyProfile = Key.getPubKey() === address;

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

    const throttledSetKnownFollowers = throttle((followers) => {
      const knownFollowers = new Set<string>();
      for (const follower of followers) {
        if (SocialNetwork.getFollowDistance(follower) === 1) {
          knownFollowers.add(follower);
        }
      }
      setKnownFollowers(Array.from(knownFollowers));
    }, 1000);

    setTimeout(() => {
      subscriptions.push(
        SocialNetwork.getFollowersByUser(address, (followers) => {
          setFollowerCount(followers.size);
          throttledSetKnownFollowers(followers);
        }),
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
        <Link href={`/follows/${address}`}>
          <b>{Math.max(followedUserCount, followedUserCountFromApi)}</b><span className="text-neutral-500"> {t('following')}</span>
        </Link>
        <Link href={`/followers/${address}`}>
          <b>{Math.max(followerCount, followerCountFromApi)}</b><span className="text-neutral-500"> {t('followers')}</span>
        </Link>
        <ProfileScoreLinks hexPub={address} />
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
