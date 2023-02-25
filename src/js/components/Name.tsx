import React, { useEffect, useState } from 'react';

import Helpers from '../Helpers';
import Nostr from '../nostr/Nostr';
import SocialNetwork from '../nostr/SocialNetwork';

import Badge from './Badge';
import AnimalName from "../AnimalName";

type Props = {
  pub: string;
  placeholder?: string;
  hideBadge?: boolean;
  userNameOnly?: boolean;
};

const Name = (props: Props) => {
  const nostrAddr = Nostr.toNostrHexAddress(props.pub);
  let initialName = '';
  let initialDisplayName;
  let isGenerated = false;
  const profileEvent = SocialNetwork.profileEventByUser.get(nostrAddr);
  // should we change SocialNetwork.getProfile() and use it here?
  if (profileEvent) {
    try {
      const profile = JSON.parse(profileEvent.content);
      initialName = profile.name?.trim().slice(0, 100) || '';
      initialDisplayName = profile.display_name?.trim().slice(0, 100);
    } catch (e) {
      // ignore
    }
  } else {
    initialDisplayName = AnimalName(Nostr.toNostrBech32Address(props.pub, 'npub') || props.pub);
    isGenerated = true;
  }
  const [name, setName] = useState(initialName);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isNameGenerated, setIsNameGenerated] = useState(isGenerated);
  useEffect(() => {
    if (nostrAddr) {
      // TODO unsub
      SocialNetwork.getProfile(nostrAddr, (profile) => {
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

export default Name;
