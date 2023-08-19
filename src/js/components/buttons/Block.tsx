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

const Block = ({ id, showName, className, onClick }: Props) => {
  const cls = 'block-btn';
  const key = 'blocked';
  const activeClass = 'blocked';
  const action = t('block');
  const actionDone = t('blocked');
  const hoverAction = t('unblock');

  const [hover, setHover] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    SocialNetwork.getBlockedUsers((blocks) => {
      const blocked = blocks?.has(Key.toNostrHexAddress(id) as string);
      setIsBlocked(!!blocked);
    });
  }, [id]);

  const handleMouseEnter = () => {
    setHover(true);
  };

  const handleMouseLeave = () => {
    setHover(false);
  };

  const onButtonClick = (e) => {
    e.preventDefault();
    const newValue = !isBlocked;
    const hex = Key.toNostrHexAddress(id);
    hex && SocialNetwork.block(hex, newValue);
    onClick?.(e);
  };

  let buttonText;
  if (isBlocked && hover) {
    buttonText = hoverAction;
  } else if (isBlocked && !hover) {
    buttonText = actionDone;
  } else {
    buttonText = action;
  }

  return (
    <button
      className={`${cls || key} ${isBlocked ? activeClass : ''} ${className || ''}`}
      onClick={onButtonClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>
        {t(buttonText)} {showName ? <Name pub={id} hideBadge={true} /> : ''}
      </span>
    </button>
  );
};

export default Block;
