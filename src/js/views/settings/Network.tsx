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
        return 'text-iris-yellow';
      case 1:
        return 'text-iris-green';
      case 2:
        return 'text-iris-yellow';
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
      <h3 className="text-lg font-semibold">{t('popular_relays')}</h3>
      <div id="popular-relays" className="flex flex-col gap-2">
        <div className="flex peer gap-2">
          <div className="flex-initial">{t('users')}</div>
          <div className="flex-grow">URL</div>
        </div>
        {popularRelays.map((relay) => (
          <div className="flex peer gap-2" key={relay.url}>
            <div className="flex-initial">{relay.users}</div>
            <div className="flex-grow">{relay.url}</div>
            <div className="flex-initial">
              <button
                className="btn btn-sm btn-neutral"
                onClick={(e) => handleAddRelay(e, relay.url)}
              >
                {t('add')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Network;
