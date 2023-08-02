import { useEffect, useState } from 'react';

import SocialNetwork from '../nostr/SocialNetwork';
import { ID } from '../nostr/UserIds';

export const useProfile = (pub: string) => {
  const [nostrAddr] = useState(pub);
  const [profile, setProfile] = useState(SocialNetwork.profiles.get(ID(nostrAddr)));

  useEffect(() => {
    if (!nostrAddr) return;

    const unsub = SocialNetwork.getProfile(nostrAddr, (p) => {
      if (p) {
        setProfile(p);
      }
    });

    return () => {
      unsub();
    };
  }, [nostrAddr]);

  return profile;
};
