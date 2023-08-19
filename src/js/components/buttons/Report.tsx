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

const Report = ({ id, showName = false, className, onClick }: Props) => {
  const cls = 'block'; // changed this from 'block-btn' to 'block'
  const key = 'reported'; // key updated for reporting
  const activeClass = 'blocked'; // activeClass remains the same
  const action = t('report_public'); // changed to report_public
  const actionDone = t('reported'); // changed to reported
  const hoverAction = t('unreport'); // changed to unreport

  const [hover, setHover] = useState(false);
  const [isReported, setIsReported] = useState(false);

  useEffect(() => {
    SocialNetwork.getFlaggedUsers((flags) => {
      const reported = flags?.has(Key.toNostrHexAddress(id) as string);
      setIsReported(!!reported);
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
    const newValue = !isReported;
    if (window.confirm(newValue ? 'Publicly report this user?' : 'Unreport user?')) {
      const hex = Key.toNostrHexAddress(id);
      hex && SocialNetwork.flag(hex, newValue);
      onClick?.(e);
    }
  };

  let buttonText;
  if (isReported && hover) {
    buttonText = hoverAction;
  } else if (isReported && !hover) {
    buttonText = actionDone;
  } else {
    buttonText = action;
  }

  return (
    <button
      className={`${cls || key} ${isReported ? activeClass : ''} ${className || ''}`}
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

export default Report;
