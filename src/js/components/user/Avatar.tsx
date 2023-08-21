import React, { useEffect, useState } from 'react';
import { sha256 } from '@noble/hashes/sha256';
import Identicon from 'identicon.js';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import Show from '../helpers/Show';
import SafeImg from '../SafeImg';

type Props = {
  str: unknown;
  hidePicture?: boolean;
  showTooltip?: boolean;
  activity?: string;
  onClick?: () => void;
  width: number;
};

const MyAvatar: React.FC<Props> = (props) => {
  const [picture, setPicture] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [activity] = useState<string | null>(null); // TODO
  const [avatar, setAvatar] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  const hex = React.useMemo(() => Key.toNostrHexAddress(props.str as string), [props.str]);

  useEffect(() => {
    const updateAvatar = () => {
      const hash = sha256(hex || (props.str as string));
      const hexVal = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const identicon = new Identicon(hexVal, {
        width: props.width,
        format: 'svg',
      });

      setAvatar(`data:image/svg+xml;base64,${identicon.toString()}`);
    };

    if (hex) {
      updateAvatar();

      const unsub = SocialNetwork.getProfile(hex, (profile) => {
        if (profile) {
          setPicture(profile.picture);
          setName(profile.name);
        }
      });

      return () => unsub?.();
    }
  }, [hex, props.str]);

  const width = props.width;
  const isActive = ['online', 'active'].includes(activity || '');
  const hasPic = picture && !hasError && !props.hidePicture && !SocialNetwork.isBlocked(hex || '');

  return (
    <div
      style={{
        maxWidth: `${width}px`,
        maxHeight: `${width}px`,
        cursor: props.onClick ? 'pointer' : undefined,
      }}
      className={`inline-flex flex-col flex-shrink-0 items-center justify-center relative select-none ${
        hasPic ? 'has-picture' : ''
      } ${props.showTooltip ? 'tooltip' : ''} ${isActive ? activity : ''}`}
      onClick={props.onClick}
    >
      <div>
        <Show when={hasPic}>
          <SafeImg
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
      </div>
      <Show when={props.showTooltip && name}>
        <span className="tooltiptext">{name}</span>
      </Show>
    </div>
  );
};

export default MyAvatar;
