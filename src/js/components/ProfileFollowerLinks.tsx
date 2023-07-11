import { useEffect, useState } from 'preact/hooks';

import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProfileFollowerLinks = (props: any) => {
  const [state, setState] = useState({ followedUserCount: 0, followerCount: 0, followsYou: false });

  const { hexPub, npub } = props;

  useEffect(() => {
    if (!hexPub) return;

    fetch(`https://eu.rbr.bio/${hexPub}/info.json`).then((res) => {
      if (!res.ok) {
        return;
      }
      res.json().then((json) => {
        if (json) {
          setState((prevState) => ({
            ...prevState,
            followerCount: json.followerCount || state.followerCount,
            followedUserCount: json.following?.length || state.followedUserCount,
            followsYou: json.followsYou || state.followsYou,
          }));
        }
      });
    });

    const sub1 = SocialNetwork.getFollowersByUser(hexPub, (followers: Set<string>) => {
      setState((prevState) => ({
        ...prevState,
        followerCount: Math.max(followers?.size ?? 0, prevState.followerCount),
      }));
    });

    const sub2 = SocialNetwork.getFollowedByUser(hexPub, (followedUsers: Set<string>) => {
      const followsYou = followedUsers?.has(Key.getPubKey()) ?? false;

      setState((prevState) => ({
        ...prevState,
        followedUserCount: Math.max(followedUsers?.size ?? 0, state.followedUserCount),
        followsYou,
      }));
    });

    return () => {
      sub1?.();
      sub2?.();
    };
  }, [hexPub]);

  return (
    <>
        <a href={'/follows/' + npub}>
          <span>{state.followedUserCount}</span> {t('following')}
        </a>
        <a href={'/followers/' + npub}>
          <span>{state.followerCount}</span> {t('followers')}
        </a>
      {state.followsYou ? (
        <span className="text-sm flex-1 text-left">
          <small> {t('follows_you')}</small>
        </span>
      ) : (
        ''
      )}
    </>
  );
};

export default ProfileFollowerLinks;
