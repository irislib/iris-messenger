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
  const nostrAddr = Key.toNostrHexAddress(props.pub) || '';
  let initialName = '';
  let initialDisplayName;
  let isGenerated = false;
  const profile = SocialNetwork.profiles.get(nostrAddr);
  // should we change SocialNetwork.getProfile() and use it here?
  if (profile) {
    initialName = profile.name?.trim().slice(0, 100) || '';
    initialDisplayName = profile.display_name?.trim().slice(0, 100);
  }
  if (!initialName) {
    initialName = AnimalName(Key.toNostrBech32Address(props.pub, 'npub') || props.pub);
    isGenerated = true;
  }
  const [name, setName] = useState(initialName);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isNameGenerated, setIsNameGenerated] = useState(isGenerated);
  useEffect(() => {
    if (nostrAddr) {
      // return Unsubscribe function so it unsubs on unmount
      return SocialNetwork.getProfile(nostrAddr, (profile) => {
        if (profile) {
          setName(profile.name?.trim().slice(0, 100) || '');
          setDisplayName(profile.display_name?.trim().slice(0, 100) || '');
          setIsNameGenerated(profile.name || profile.display_name ? false : true);
        }
      });
    }
  }, [props.pub]);

  return (
    <>
      <span className={isNameGenerated ? 'text-neutral-500' : ''}>
        {name || displayName || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
    </>
  );
};

export default memo(Name);
