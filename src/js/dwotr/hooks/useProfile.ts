import { useEffect, useState } from 'react';
import profileManager from '../ProfileManager';
import { ID } from '../../nostr/UserIds';
import ProfileRecord, { ProfileMemory } from '../model/ProfileRecord';
import { ProfileEvent } from '../network/ProfileEvent';


// Address can be of type hex of BECH32
export const useProfile = (address: string) => {

  //console.log('dwotr.useProfile.address', address)

  const [profile, setProfile] = useState<ProfileRecord>(() => profileManager.getMemoryProfile(ID(address)));

  useEffect(() => {
    //if (!address) return;
    //console.log('dwotr.useProfile.mount', address);

    let id = ID(address);

    let mem = profileManager.getMemoryProfile(id);
    if(profile.created_at != mem.created_at) {
      setProfile(mem);
    }

    const handleEvent = (e: any) => {
      let p = e.detail as ProfileMemory;
      if(!p || p.id != id) return; // not for me

      setProfile(prevProfile => {
        if (p.created_at <= prevProfile.created_at) return prevProfile; // ignore older events
        return p;
      });
    };

    ProfileEvent.add(handleEvent);

    let unsub = profileManager.subscribe(address);

    return () => {
      //console.log('dwotr.useProfile.unmount', address);
      ProfileEvent.remove(handleEvent);
      unsub?.();
    };
  }, [address]);

  return profile;
};
