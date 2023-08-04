import { useEffect, useState, useRef } from 'react';
import profileManager from '../ProfileManager';
import { ID } from '../../nostr/UserIds';
import ProfileRecord from '../model/ProfileRecord';
import { TrustScoreEvent } from '../GraphNetwork';

export const ProfileEventName = 'profileEvent';

export class ProfileEvent extends CustomEvent<ProfileRecord> {
  constructor(id: number, item: ProfileRecord) {
    super(TrustScoreEvent.getEventId(id), { detail: item });
  }

  static getEventId(id: number): string {
    return ProfileEventName + id;
  }
}

// Address can be of type hex of BECH32
export const useProfile = (address: string) => {
  const id = useRef<number>(ID(address));
  const [profile, setProfile] = useState<ProfileRecord>(
    profileManager.getCurrentProfile(id.current),
  );

  useEffect(() => {
    if (!address) return;

    const handleEvent = (e: any) => {
      let p = e.detail as ProfileRecord;
      if (!p || p.created_at <= profile.created_at) return;
      setProfile(e.detail);
    };

    let eventID = TrustScoreEvent.getEventId(id.current);
    window.addEventListener(eventID, handleEvent);

    profileManager.subscribe(address);

    return () => {
      // remove the event listener when the component unmounts
      window.removeEventListener(eventID, handleEvent);
      profileManager.unsubscribe(address);
    };
  }, [address]);

  return profile;
};
