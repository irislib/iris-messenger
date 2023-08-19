import { useEffect, useState } from 'react';

import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';
import Name from '../user/Name';

type Props = {
  id: string;
  showName?: boolean;
  className?: string;
  onClick?: (e) => void;
};

const Block = ({ id, showName = false, className, onClick }: Props) => {
  const [hover, setHover] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    SocialNetwork.getBlockedUsers((blocks) => {
      const blocked = blocks?.has(Key.toNostrHexAddress(id) as string);
      setIsBlocked(!!blocked);
    });
  }, [id]);

  const onButtonClick = (e) => {
    e.preventDefault();
    const newValue = !isBlocked;
    const hex = Key.toNostrHexAddress(id);
    hex && SocialNetwork.block(hex, newValue);
    onClick?.(e);
  };

  const buttonText = isBlocked ? (hover ? t('unblock') : t('blocked')) : t('block');

  return (
    <button
      className={`block-btn ${isBlocked ? 'blocked' : ''} ${className || ''}`}
      onClick={onButtonClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span>
        {buttonText} {showName && <Name pub={id} hideBadge={true} />}
      </span>
    </button>
  );
};

export default Block;
