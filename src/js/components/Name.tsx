import { memo, useEffect, useState } from 'react';

import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { ID } from '../nostr/UserIds';

import Badge from './Badge';
import useVerticeMonitor from '../dwotr/components/useVerticeMonitor';
import profileManager from '../dwotr/ProfileManager';

type Props = {
  pub: string;
  hexKey?: string;
  placeholder?: string;
  hideBadge?: boolean;
};

type Profile = {
  name: string;
  displayName: string;
  isDefault: boolean;
};

const Name = (props: Props) => {
  const hexKey = props.hexKey || Key.toNostrHexAddress(props.pub) || '';

  const [profile, setProfile] = useState<any>(() => profileManager.sanitizeProfile(SocialNetwork.profiles.get(ID(hexKey)), hexKey));

  const wot = useVerticeMonitor(ID(hexKey), ['badName', 'neutralName', 'goodName'], '');

  useEffect(() => {
    if (!hexKey) return;

    const p = SocialNetwork.profiles.get(ID(hexKey));
    if (p) {
      let sanitized = p;
      if (
        sanitized.name !== profile.name ||
        sanitized.displayName !== profile.displayName ||
        sanitized.isDefault !== profile.isDefault
      )
        setProfile(sanitized);
    } else {
      return SocialNetwork.getProfile(hexKey, (p) => {
        setProfile(p);
      });
    }
  }, [props.pub]);

  if (!props.pub) return null;

  return (
    <>
      <span className={(profile.isDefault ? 'text-neutral-500' : '') + ' ' + wot?.option}>
        {profile.name || profile.displayName || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} hexKey={hexKey} />}
    </>
  );
};

export default memo(Name);
