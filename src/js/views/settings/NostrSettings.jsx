import React, { useState } from 'react';
import iris from 'iris-lib';

import Button from '../../components/basic/Button';
import CopyButton from '../../components/CopyButton';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';
const bech32 = require('bech32-buffer');

const NostrSettings = () => {
  const [relays, setRelays] = useState([]);
  const [newRelayUrl, setNewRelayUrl] = useState(''); // added state to store the new relay URL
  const [maxRelays, setMaxRelays] = useState(Nostr.maxRelays);

  setInterval(() => {
    const relays = Nostr.relayPool.getRelayStatuses();
    setRelays(relays);
  }, 1000);

  const handleConnectClick = (relay) => {
    iris.local().get('relays').get(relay.url).put({ enabled: true });
    Nostr.connectRelay(relay);
  };

  const handleDisconnectClick = (relay) => {
    iris.local().get('relays').get(relay.url).put({ enabled: false });
    relay.close();
  };

  const handleRemoveRelay = (relay) => {
    iris.local().get('relays').get(relay.url).put(null);
    Nostr.removeRelay(relay.url);
  };

  const handleAddRelay = (event) => {
    iris.local().get('relays').get(newRelayUrl).put({ enabled: true });
    event.preventDefault(); // prevent the form from reloading the page
    Nostr.addRelay(newRelayUrl); // add the new relay using the Nostr method
    setNewRelayUrl(''); // reset the new relay URL
  };

  const maxRelaysChanged = (event) => {
    // parse int
    const maxRelays = parseInt(event.target.value);
    iris.local().get('maxRelays').put(maxRelays);
    setMaxRelays(maxRelays);
  };

  const getClassName = (status) => {
    switch (status) {
      case 0:
        return "neutral";
      case 1:
        return "positive";
      case 2:
        return "neutral";
      case 3:
        return "";
      default:
        return "status";
    }
  }

  const myPrivHex = iris.session.getKey().secp256k1.priv;
  let myPriv32;
  if (myPrivHex) {
    myPriv32 = bech32.encode('nsec', Buffer.from(myPrivHex, 'hex'));
  }
  let myPub = iris.session.getKey().secp256k1.rpub;
  myPub = bech32.encode('npub', Buffer.from(myPub, 'hex'));

  return (
    <div className="centered-container">
      <h2>Nostr</h2>
      <h3>Key</h3>
      <div className="flex-table">
        <div className="flex-row">
          <div className="flex-cell">
            <p>Public key:</p>
            <input type="text" value={myPub} />
          </div>
          <div className="flex-cell no-flex">
            <CopyButton
              copyStr={myPub}
              text="Copy public key" />
          </div>
        </div>
        <div className="flex-row">
          <div className="flex-cell">
            Private key
          </div>
          <div className="flex-cell no-flex">
            {myPrivHex ? (
              <>
                <CopyButton
                  notShareable={true}
                  copyStr={myPrivHex}
                  text="Copy hex" />
                <CopyButton
                  notShareable={true}
                  copyStr={myPriv32}
                  text="Copy nsec" />
              </>
            ) : (
              <p>Not present. Good!</p>
            )}
          </div>
        </div>
      </div>
      {myPrivHex ? <p dangerouslySetInnerHTML={{ __html: t('private_key_warning') }}></p> : ''}

      <h3>Relays</h3>
      <p>
        Max relays: <input
          type="number"
          value={maxRelays}
          onChange={maxRelaysChanged}
        />
      </p>
      <div id="peers" className="flex-table">
        {relays.map(([url, status]) => (
          <div className="flex-row peer">
            <div className="flex-cell" key={url}>
              <span className={getClassName(status)}>&#x2B24; </span>
              {url}
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
              onChange={event => setNewRelayUrl(event.target.value)}
            />
          </div>
          <div className="flex-cell no-flex">
            <Button onClick={handleAddRelay}>{t('add')}</Button>
          </div>
        </div>
        <div>
          <Button onClick={() => Nostr.saveRelaysToContacts()}>{t('save_relays_publicly')}</Button>
          <Button onClick={() => Nostr.restoreDefaultRelays()}>{t('restore_default_relays')}</Button>
        </div>
      </div>
    </div>
  );
};

export default NostrSettings;