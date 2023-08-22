import { useEffect, useState } from 'react';

import Relays from '@/nostr/Relays.ts';
import { translate as t } from '@/translations/Translation.mjs';
import Icons from '@/utils/Icons.tsx';

export default function ConnectedRelaysIndicator() {
  const [connectedRelays, setConnectedRelays] = useState(Relays.getConnectedRelayCount());

  const updateRelayCount = () => {
    setConnectedRelays(Relays.getConnectedRelayCount());
  };

  useEffect(() => {
    updateRelayCount();
    const intervalId = setInterval(updateRelayCount, 1000);

    // Cleanup when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <a
      href="/settings/network"
      className={`ml-2 tooltip tooltip-bottom mobile-search-hidden ${
        connectedRelays === 0 ? 'text-iris-orange' : ''
      }`}
      data-tip={t('connected_relays')}
    >
      <small className="flex items-center gap-2">
        <span class="icon">{Icons.network}</span>
        <span>{connectedRelays}</span>
      </small>
    </a>
  );
}
