import { useEffect, useState } from 'react';

import Key from '@/nostr/Key.ts';
import SocialNetwork from '@/nostr/SocialNetwork.ts';
import { ID, STR } from '@/utils/UniqueIds.ts';

export const useFollows = (key = Key.getPubKey(), includeSelf = true) => {
  const id = ID(key);
  const [followedUsers, setFollowedUsers] = useState(() => {
    const initialFollowedUsers = SocialNetwork.followedByUser.get(id) || new Set();
    if (includeSelf) {
      initialFollowedUsers.add(id);
    }
    return Array.from(initialFollowedUsers).map((n) => STR(n));
  });

  useEffect(() => {
    const unsub = SocialNetwork.getFollowedByUser(
      Key.getPubKey(),
      (newFollowedUsers) => {
        setFollowedUsers(Array.from(newFollowedUsers));
      },
      includeSelf,
    );

    return () => {
      unsub?.();
    };
  }, [key, includeSelf]);

  return followedUsers;
};
