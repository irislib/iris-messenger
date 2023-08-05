import { memo, useEffect, useState } from 'react';

import Key from '../../nostr/Key';
import { ID } from '../../nostr/UserIds';

import Badge from './Badge';
import useVerticeMonitor from '../../dwotr/hooks/useVerticeMonitor';
import { useProfile } from '../../dwotr/hooks/useProfile';

type Props = {
  pub: string;
  hexKey?: string;
  placeholder?: string;
  hideBadge?: boolean;
};


const Name = (props: Props) => {
  const hexKey = props.hexKey || Key.toNostrHexAddress(props.pub) || '';

  //const [profile, setProfile] = useState<any>(() => profileManager.quickProfile(hexKey));
  const profile = useProfile(hexKey);

  const wot = useVerticeMonitor(ID(hexKey), ['badName', 'neutralName', 'goodName'], '');

  // useEffect(() => {
  //   return profileManager.getProfile(hexKey, (p) => {
  //     setProfile(p);
  //   });
  // }, [props.pub, props.hexKey]);

  return (
    <>
      <span className={(profile.isDefault ? 'text-neutral-500' : '') + ' ' + wot?.option}>
        {profile.name || profile.display_name || props.placeholder}
      </span>
      {props.hideBadge ? '' : <Badge pub={hexKey} />}
    </>
  );
};

export default Name;