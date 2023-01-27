import React, { useEffect, useState } from 'react';

import Helpers from '../Helpers';
import Nostr from '../Nostr';

import Badge from './Badge';

type Props = {
  pub: string;
  placeholder?: string;
  hideBadge?: boolean;
};

const Name = (props: Props) => {
  const initialName = Helpers.generateName(
    Nostr.toNostrBech32Address(props.pub, 'npub') || props.pub,
  );
  const [name, setName] = useState(initialName);
  useEffect(() => {
    const nostrAddr = Nostr.toNostrHexAddress(props.pub);
    if (nostrAddr) {
      // TODO unsub
      Nostr.getProfile(nostrAddr, (profile) => {
        profile && setName(profile.name?.trim());
      });
    }
  }, [props.pub]);

  return (
    <>
      {name ?? props.placeholder}
      {props.hideBadge ? '' : <Badge pub={props.pub} />}
    </>
  );
};

export default Name;
