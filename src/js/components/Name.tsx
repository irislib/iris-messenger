import { memo, useEffect, useState } from 'react';

import AnimalName from '../AnimalName';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';

import Badge from './Badge';

type Props = {
  pub: string;
  placeholder?: string;
  hideBadge?: boolean;
};

const Name = (props: Props) => {
  if (!props.pub) {
    console.error('Name component requires a pub', props);
    return null;
  }

  const [nostrAddr] = useState(Key.toNostrHexAddress(props.pub) || '');
  const [profile, setProfile] = useState(profileInitializer);

  function profileInitializer() {
    let name;
    let displayName;
    let isNameGenerated = false;

    const profile = SocialNetwork.profiles.get(nostrAddr);
    // should we change SocialNetwork.getProfile() and use it here?
    if (profile) {
      name = profile.name?.trim().slice(0, 100) || '';
      displayName = profile.display_name?.trim().slice(0, 100);
    }
    if (!name) {
      name = AnimalName(Key.toNostrBech32Address(props.pub, 'npub') || props.pub);
      isNameGenerated = true;
    }

    return { name, displayName, isNameGenerated };
  }

  useEffect(() => {
    if (!nostrAddr) return;

    const unsub = SocialNetwork.getProfile(nostrAddr, (p) => {
      if (p) {
        const name = p.name?.trim().slice(0, 100) || '';
        const displayName = p.display_name?.trim().slice(0, 100) || '';
        const isNameGenerated = p.name || p.display_name ? false : true;

        setProfile({ name, displayName, isNameGenerated });
      }
    });

    return () => {
      unsub();
    };
  }, [nostrAddr]);

  return (
    <>
      <span className={profile.isNameGenerated ? 'text-neutral-500' : ''}>
        {profile.name || profile.displayName || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
    </>
  );
};

export default memo(Name);
