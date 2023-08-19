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
  const [hover, setHover] = useState(false);
  const [isReported, setIsReported] = useState(false);

  useEffect(() => {
    SocialNetwork.getFlaggedUsers((flags) => {
      const reported = flags?.has(Key.toNostrHexAddress(id) as string);
      setIsReported(!!reported);
    });
  }, [id]);

  const onButtonClick = (e) => {
    e.preventDefault();
    const newValue = !isReported;
    if (window.confirm(newValue ? 'Publicly report this user?' : 'Unreport user?')) {
      const hex = Key.toNostrHexAddress(id);
      hex && SocialNetwork.flag(hex, newValue);
      onClick?.(e);
    }
  };

  const buttonText = isReported ? (hover ? t('unreport') : t('reported')) : t('report_public');

  return (
    <button
      className={`block ${isReported ? 'blocked' : ''} ${className || 'reported'}`}
      onClick={onButtonClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span>
        {buttonText} {showName ? <Name pub={id} hideBadge={true} /> : ''}
      </span>
    </button>
  );
};

export default Report;
