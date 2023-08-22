import { memo, useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { Link } from 'preact-router';

import InfiniteScroll from '@/components/helpers/InfiniteScroll.tsx';
import View from '@/views/View.tsx';

import Follow from '../../components/buttons/Follow.tsx';
import Show from '../../components/helpers/Show.tsx';
import Avatar from '../../components/user/Avatar.tsx';
import Name from '../../components/user/Name.tsx';
import Key from '../../nostr/Key.ts';
import SocialNetwork from '../../nostr/SocialNetwork.ts';
import { translate as t } from '../../translations/Translation.mjs';
import { ID } from '../../utils/UniqueIds.ts';

const FollowedUser = memo(({ hexKey }: { hexKey: string }) => {
  const npub = Key.toNostrBech32Address(hexKey, 'npub') || '';
  return (
    <div key={npub} className="flex w-full">
      <Link href={`/${npub}`} className="flex flex-1 gap-4">
        <Avatar str={npub} width={49} />
        <div>
          <Name pub={npub} />
          <br />
          <span className="text-neutral-500 text-sm">
            {SocialNetwork.followersByUser.get(ID(hexKey))?.size || 0}
            <i> </i>
            followers
          </span>
        </div>
      </Link>
      {Key.isMine(hexKey) && <Follow id={npub} />}
    </div>
  );
});

type Props = {
  id?: string;
  followers?: boolean;
  path: string;
};

const Follows: React.FC<Props> = (props) => {
  const [follows, setFollows] = useState<any>([]);
  const followsRef = useRef(new Set());
  const myPubRef = useRef<string | null>(null);

  const sortByName = useCallback((aK, bK) => {
    const aName = SocialNetwork.profiles.get(ID(aK))?.name;
    const bName = SocialNetwork.profiles.get(ID(bK))?.name;
    if (!aName && !bName) return aK.localeCompare(bK);
    if (!aName) return 1;
    if (!bName) return -1;
    return aName.localeCompare(bName);
  }, []);

  const sortByFollowDistance = useCallback(
    (aK, bK) => {
      const aDistance = SocialNetwork.followDistanceByUser.get(ID(aK));
      const bDistance = SocialNetwork.followDistanceByUser.get(ID(bK));
      if (aDistance === bDistance) return sortByName(aK, bK);
      if (aDistance === undefined) return 1;
      if (bDistance === undefined) return -1;
      return aDistance < bDistance ? -1 : 1;
    },
    [sortByName],
  );

  const updateSortedFollows = useCallback(
    throttle(() => {
      const comparator = (a, b) =>
        props.followers ? sortByFollowDistance(a, b) : sortByName(a, b);
      setFollows(Array.from(followsRef.current).sort(comparator));
    }, 1000),
    [props.followers, sortByFollowDistance, sortByName],
  );

  useEffect(() => {
    if (props.id) {
      myPubRef.current = Key.toNostrBech32Address(Key.getPubKey(), 'npub');
      props.followers ? getFollowers() : getFollows();
    }
  }, [props.id, props.followers]);

  if (!props.id) {
    return null;
  }

  const getFollows = () => {
    const hex = Key.toNostrHexAddress(props.id!) || '';
    if (hex) {
      SocialNetwork.getFollowedByUser(hex, (newFollows) => {
        followsRef.current = newFollows; // TODO might still be buggy?
        updateSortedFollows();
      });
    }
  };

  const getFollowers = () => {
    const hex = Key.toNostrHexAddress(props.id!) || '';
    if (hex) {
      SocialNetwork.getFollowersByUser(hex, (newFollowers) => {
        followsRef.current = newFollowers;
        updateSortedFollows();
      });
    }
  };

  const followAll = () => {
    if (confirm(`${t('follow_all')} (${follows.length})?`)) {
      SocialNetwork.setFollowed(follows);
    }
  };

  const showFollowAll = follows.length > 1 && !(props.id === myPubRef.current && !props.followers);

  return (
    <View>
      <div className="px-4 mb-4">
        <div className="flex justify-between mb-4">
          <span className="text-xl font-bold">
            <a className="link" href={`/${props.id}`}>
              <Name pub={props.id} />
            </a>
            :<i> </i>
            <span style={{ flex: 1 }} className="ml-1">
              {props.followers ? t('followers') : t('following')}
            </span>
          </span>
          <Show when={showFollowAll}>
            <span style={{ textAlign: 'right' }} className="hidden md:inline">
              <button className="btn btn-sm btn-neutral" onClick={followAll}>
                {t('follow_all')} ({follows.length})
              </button>
            </span>
          </Show>
        </div>
        <Show when={showFollowAll}>
          <p style={{ textAlign: 'right' }} className="inline md:hidden">
            <button className="btn btn-sm btn-neutral" onClick={followAll}>
              {t('follow_all')} ({follows.length})
            </button>
          </p>
        </Show>
        <div className="flex flex-col w-full gap-4">
          <InfiniteScroll>
            {follows.map((hexKey) => (
              <FollowedUser key={hexKey} hexKey={hexKey} />
            ))}
          </InfiniteScroll>
          {follows.length === 0 ? '—' : ''}
        </div>
      </div>
    </View>
  );
};

export default Follows;
