import { ProfileMemory } from "../model/ProfileRecord";

export const ProfileEventName = 'profileEvent';

export class ProfileEvent extends CustomEvent<ProfileMemory> {
  constructor(item: ProfileMemory) {
    super(ProfileEventName, { detail: item });
  }

  static dispatch(id: number, profile: ProfileMemory) {
    if(!profile?.id || profile.id == 0) profile.id = id;
    
    document.dispatchEvent(new ProfileEvent(profile));
  }

  static add(callback: (e: any) => void) {
    document.addEventListener(ProfileEventName, callback);
  }

  static remove(callback: (e: any) => void) {
    document.removeEventListener(ProfileEventName, callback);
  }
}
