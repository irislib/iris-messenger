import { memo, useEffect, useState } from 'react';

import AnimalName from '../AnimalName';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';

import Badge from './Badge';

type Props = {
  pub: string;
  placeholder?: string;
  hideBadge?: boolean;
  userNameOnly?: boolean;
  displayNameOnly?: boolean; // Add the new prop here
};

const Name = (props: Props) => {
  if (!props.pub) {
    console.error('Name component requires a pub', props);
    return null;
  }
  const nostrAddr = Key.toNostrHexAddress(props.pub);
  let initialName = '';
  let initialDisplayName;
  let isGenerated = false;
  const profile = SocialNetwork.profiles.get(nostrAddr);
  // should we change SocialNetwork.getProfile() and use it here?
  if (profile) {
    initialName = profile.name?.trim().slice(0, 100) || '';
    initialDisplayName = profile.display_name?.trim().slice(0, 100);
  }
  if (!initialDisplayName) {
    initialDisplayName = AnimalName(Key.toNostrBech32Address(props.pub, 'npub') || props.pub);
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
  if (props.userNameOnly) {
    return (
      <>
        {name || displayName}
        {props.hideBadge ? '' : <Badge pub={props.pub} />}
      </>
    );
  }

  if (props.displayNameOnly) {
    return (
      <>
        <span className={`display-name ${isNameGenerated ? 'generated' : ''}`}>
          {displayName || name || props.placeholder}
        </span>
        {props.hideBadge ? '' : <Badge pub={props.pub} />}
      </>
    );
  }

  const showUserName = name && displayName && displayName.toLowerCase() !== name.toLowerCase();

  return (
    <>
      <span className={`display-name ${isNameGenerated ? 'generated' : ''}`}>
        {displayName || name || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
      {showUserName ? <small className="user-name mar-left5">@{name}</small> : ''}
    </>
  );
};

export default memo(Name);
