import React, { useEffect, useState } from 'react';
import { sha256 } from '@noble/hashes/sha256';
import Identicon from 'identicon.js';

import { useProfile } from '@/nostr/hooks/useProfile.ts';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import Show from '../helpers/Show';
import ProxyImg from '../ProxyImg.tsx';

type Props = {
  str: string;
  hidePicture?: boolean;
  showTooltip?: boolean;
  activity?: string;
  onClick?: () => void;
  width: number;
};

const MyAvatar: React.FC<Props> = (props) => {
  const [activity] = useState<string | null>(null); // TODO
  const [avatar, setAvatar] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const hex = React.useMemo(
    () => Key.toNostrHexAddress(props.str as string) || props.str,
    [props.str],
  );

  const { picture, name } = useProfile(hex || '');

  useEffect(() => {
    if (!hex) {
      return;
    }
    const hash = sha256(hex || (props.str as string));
    const hexVal = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const identicon = new Identicon(hexVal, {
      width: props.width,
      format: 'svg',
    });

    setAvatar(`data:image/svg+xml;base64,${identicon.toString()}`);
  }, [hex, props.str]);

  const width = props.width;
  const isActive = ['online', 'active'].includes(activity || '');
  const hasPic = picture && !hasError && !props.hidePicture && !SocialNetwork.isBlocked(hex || '');

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${width}px`,
        cursor: props.onClick ? 'pointer' : undefined,
      }}
      className={`inline-flex flex-col flex-shrink-0 items-center justify-center relative select-none ${
        hasPic ? 'has-picture' : ''
      } ${props.showTooltip ? 'tooltip' : ''} ${isActive ? activity : ''}`}
      onClick={props.onClick}
    >
      <Show when={hasPic}>
        <ProxyImg
          className="object-cover rounded-full"
          src={picture || ''}
          width={width}
          square={true}
          onError={() => setHasError(true)}
        />
      </Show>
      <Show when={!hasPic}>
        <img width={width} className="max-w-full rounded-full" src={avatar || ''} />
      </Show>
      <Show when={props.showTooltip && name}>
        <span className="tooltiptext">{name}</span>
      </Show>
    </div>
  );
};

export default MyAvatar;
