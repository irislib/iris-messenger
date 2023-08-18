import { useEffect, useState } from 'react';

import { ID } from '../utils/UniqueIds.ts';
import profileManager from '../dwotr/ProfileManager';

export const useProfile = (address: string) => {
  const [profile, setProfile] = useState(profileManager.getDefaultProfile(ID(address)));

  useEffect(() => {
    if (!address) return;

    // const unsub = profileManager.getProfile(address, (p) => {
    //   if (p) {
    //     setProfile(p);
    //   }
    // });

    return () => {
      //unsub();
    };
  }, [address]);

  return profile;
};
