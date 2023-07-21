import { memo, useEffect, useState } from 'react';

import AnimalName from '../AnimalName';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';

import Badge from './Badge';
import useVerticeMonitor from '../dwotr/useVerticeMonitor';

type Props = {
  pub: string;
  hexKey?: string;
  placeholder?: string;
  hideBadge?: boolean;
};

type Profile = {
  name: string;
  displayName: string;
  isNameGenerated: boolean;
};

export function sanitizeProfile(p: any, npub:string) {
  if (!p) 
    p = { name: '', displayName: '', isNameGenerated: false, dummy: true };

  let name = p.name?.trim().slice(0, 100) || '';
  let isNameGenerated = p.name || p.display_name ? false : true;
  let picture = p.picture;

  if (!name) {
    name = AnimalName(Key.toNostrBech32Address(npub, 'npub') || npub);
    isNameGenerated = true;
  }

  let displayName = p.display_name?.trim().slice(0, 100) || name;

  return { name, displayName, picture, isNameGenerated, dummy: false };
}

const Name = (props: Props) => {
  const hexKey = props.hexKey || Key.toNostrHexAddress(props.pub) || '';

  const [profile, setProfile] = useState<Profile>(() =>
    sanitizeProfile(SocialNetwork.profiles.get(hexKey), props.pub),
  );

  const wot = useVerticeMonitor(hexKey, ['badName', 'neutralName', 'goodName'], '');



  useEffect(() => {
    if (!hexKey) return;

    const p = SocialNetwork.profiles.get(hexKey);
    if (p) {
      let sanitized = sanitizeProfile(p, props.pub);
      if (
        sanitized.name !== profile.name ||
        sanitized.displayName !== profile.displayName ||
        sanitized.isNameGenerated !== profile.isNameGenerated
      )
        setProfile(sanitized);
    } else {
      return SocialNetwork.getProfile(hexKey, (p) => {
        setProfile(sanitizeProfile(p, props.pub));
      });
    }
  }, [props.pub]);

  if (!props.pub) return null;

  return (
    <>
      <span className={(profile.isNameGenerated ? 'text-neutral-500' : '') + ' ' + wot?.option}>
        {profile.name || profile.displayName || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} hexKey={hexKey} />}
    </>
  );
};

export default memo(Name);
