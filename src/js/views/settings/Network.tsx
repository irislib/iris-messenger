import { useEffect, useState } from 'preact/compat';

import { PrimaryButton as Button } from '../../components/buttons/Button';
import localState from '../../LocalState';
import PubSub from '../../nostr/PubSub';
import Relays, { PopularRelay } from '../../nostr/Relays';
import { translate as t } from '../../translations/Translation.mjs';

const Network = () => {
  const [relays, setRelays] = useState(Array.from(Relays.relays.values()));
  const [popularRelays, setPopularRelays] = useState([] as PopularRelay[]);
  const [newRelayUrl, setNewRelayUrl] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setRelays(Array.from(Relays.relays.values()));
    }, 2000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    setPopularRelays(Relays.getPopularRelays());
  }, []);

  const handleRemoveRelay = (relay) => {
    localState.get('relays').get(relay.url).put(null);
    Relays.remove(relay.url);
  };

  const ensureProtocol = (relay) => {
    if (relay.includes('://')) return relay;

    return `wss://${relay}`;
  };

  const handleAddRelay = (event, url) => {
    const newRelayUrlWithProtocol = ensureProtocol(url);
    localState
      .get('relays')
      .get(newRelayUrlWithProtocol)
      .put({ enabled: true, newRelayUrlWithProtocol });
    event.preventDefault(); // prevent the form from reloading the page
    Relays.add(newRelayUrlWithProtocol); // add the new relay using the Nostr method
    setNewRelayUrl(''); // reset the new relay URL
  };

  const getStatus = (relay) => {
    try {
      return PubSub.relayPool.relayByUrl.get(relay.url).status;
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
                  relay.enabled ? Relays.enable(relay.url) : Relays.disable(relay.url);
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
              onChange={(event) => setNewRelayUrl((event.target as HTMLInputElement).value)}
            />
          </div>
          <div className="flex-cell no-flex">
            <Button onClick={(e) => handleAddRelay(e, newRelayUrl)}>{t('add')}</Button>
          </div>
        </div>
        <p>
          <Button onClick={() => Relays.saveToContacts()}>{t('save_relays_publicly')}</Button>
          <Button onClick={() => Relays.restoreDefaults()}>{t('restore_defaults')}</Button>
        </p>
      </div>
      <h3>{t('popular_relays')}</h3>
      <div id="popular-relays" className="flex-table">
        <div className="flex-row peer">
          <div className="flex-cell no-flex">{t('users')}</div>
          <div className="flex-cell">URL</div>
        </div>
        {popularRelays.map((relay) => (
          <div className="flex-row peer" key={relay.url}>
            <div className="flex-cell no-flex">{relay.users}</div>
            <div className="flex-cell">{relay.url}</div>
            <div className="flex-cell no-flex">
              <Button onClick={(e) => handleAddRelay(e, relay.url)}>{t('add')}</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Network;
