import React, { useEffect, useState } from 'react';

import Helpers from '../Helpers';
import Nostr from '../Nostr';

import Badge from './Badge';

type Props = {
  pub: string;
  placeholder?: string;
  hideBadge?: boolean;
  userNameOnly?: boolean;
};

const Name = (props: Props) => {
  const initialName = Helpers.generateName(
    Nostr.toNostrBech32Address(props.pub, 'npub') || props.pub,
  );
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState(initialName);
  useEffect(() => {
    const nostrAddr = Nostr.toNostrHexAddress(props.pub);
    if (nostrAddr) {
      // TODO unsub
      Nostr.getProfile(nostrAddr, (profile) => {
        profile && setName(profile.name?.trim().slice(0, 100) || '');
        profile && setDisplayName(profile.display_name?.trim().slice(0, 100) || '');
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
      <span class="display-name">{displayName || name || props.placeholder}</span>
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
      {showUserName ? <small className="user-name mar-left5">@{name}</small> : ''}
    </>
  );
};

export default Name;
