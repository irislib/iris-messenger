import { useEffect, useState } from 'react';
import profileManager from '../ProfileManager';
import { ID } from '../../nostr/UserIds';
import ProfileRecord from '../model/ProfileRecord';

export const ProfileEventName = 'profileEvent';

export class ProfileEvent extends CustomEvent<ProfileRecord> {
  constructor(id: number, item: ProfileRecord) {
    super(ProfileEvent.getEventId(id), { detail: item });
  }

  static getEventId(id: number): string {
    return ProfileEventName + id;
  }

  static dispatch(id: number, item: ProfileRecord) {
    document.dispatchEvent(new ProfileEvent(id, item));
  }

  static add(id: number, callback: (e: any) => void) {
    document.addEventListener(ProfileEvent.getEventId(id), callback);
  }

  static remove(id: number, callback: (e: any) => void) {
    document.removeEventListener(ProfileEvent.getEventId(id), callback);
  }


}

// Address can be of type hex of BECH32
export const useProfile = (address: string) => {

  console.log('useProfile.address', address)

  const [profile, setProfile] = useState<ProfileRecord>(() => profileManager.getMemoryProfile(ID(address)));

  useEffect(() => {
    if (!address) return;

    let mem = profileManager.getMemoryProfile(ID(address));
    if(profile.created_at != mem.created_at) {
      setProfile(mem);
    }

    const handleEvent = (e: any) => {
      let p = e.detail as ProfileRecord;
      setProfile(prevProfile => {
        if (!p || p.created_at <= prevProfile.created_at) return prevProfile;
        return p;
      });
    };

    ProfileEvent.add(ID(address), handleEvent);

    let unsub = profileManager.subscribe(address);

    return () => {
      ProfileEvent.remove(ID(address), handleEvent);
      unsub?.();
    };
  }, [address]);

  return profile;
};
