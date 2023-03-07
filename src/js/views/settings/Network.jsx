import React, { useState } from 'react';

import Button from '../../components/buttons/Button';
import localState from '../../LocalState';
import Relays from '../../nostr/Relays';
import { translate as t } from '../../translations/Translation';

const Network = () => {
  const [relays, setRelays] = useState(Array.from(Relays.relays.values()));
  const [newRelayUrl, setNewRelayUrl] = useState(''); // added state to store the new relay URL

  setInterval(() => {
    setRelays(Array.from(Relays.relays.values()));
  }, 1000);

  const handleRemoveRelay = (relay) => {
    localState.get('relays').get(relay.url).put(null);
    Relays.remove(relay.url);
  };

  const ensureProtocol = (relay) => {
    if (relay.includes('://')) return relay;

    return `wss://${relay}`;
  };

  const handleAddRelay = (event) => {
    const newRelayUrlWithProtocol = ensureProtocol(newRelayUrl);
    localState.get('relays').get(newRelayUrlWithProtocol).put({ enabled: true });
    event.preventDefault(); // prevent the form from reloading the page
    Relays.add(newRelayUrlWithProtocol); // add the new relay using the Nostr method
    setNewRelayUrl(''); // reset the new relay URL
  };

  const getStatus = (relay) => {
    try {
      return relay.status;
    } catch (e) {
      return 3;
    }
  };

  const getClassName = (relay) => {
    switch (getStatus(relay)) {
      case 0:
        return 'neutral';
      case 1:
        return 'positive';
      case 2:
        return 'neutral';
      case 3:
        return '';
      default:
        return 'status';
    }
  };

  return (
    <div className="centered-container">
      <h2>{t('network')}</h2>
      <div id="peers" className="flex-table">
        {relays.map((relay) => (
          <div className="flex-row peer">
            <div className="flex-cell" key={relay.url}>
              <span className={getClassName(relay)}>&#x2B24; </span>
              {relay.url}
            </div>
            <div className="flex-cell no-flex">
              <Button onClick={() => handleRemoveRelay(relay)}>{t('remove')}</Button>
            </div>
            <div className="flex-cell no-flex">
              <input
                type="checkbox"
                checked={relay.enabled !== false}
                onChange={() => {
                  relay.enabled = !(relay.enabled !== false);
                  relay.enabled ? relay.connect() : relay.close();
                }}
              />
            </div>
          </div>
        ))}
        <div className="flex-row peer">
          <div className="flex-cell" key="new">
            <input
              id="new-relay-url"
              type="text"
              placeholder={t('new_relay_url')}
              value={newRelayUrl}
              onChange={(event) => setNewRelayUrl(event.target.value)}
            />
          </div>
          <div className="flex-cell no-flex">
            <Button onClick={handleAddRelay}>{t('add')}</Button>
          </div>
        </div>
        <div>
          <Button onClick={() => Relays.saveToContacts()}>{t('save_relays_publicly')}</Button>
          <Button onClick={() => Relays.restoreDefaults()}>{t('restore_defaults')}</Button>
        </div>
      </div>
    </div>
  );
};

export default Network;
