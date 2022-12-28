import React, {useState} from "react";
import Nostr from "../../Nostr";
import Button from '../../components/basic/Button';
import iris from 'iris-lib';
import CopyButton from '../../components/CopyButton';
import { translate as t } from '../../translations/Translation';
const bech32 = require('bech32-buffer');

const NostrSettings = () => {
  const [relays, setRelays] = useState(Array.from(Nostr.relays.values()));
  const [newRelayUrl, setNewRelayUrl] = useState(""); // added state to store the new relay URL

  setInterval(() => {
    setRelays(Array.from(Nostr.relays.values()));
  }, 1000);

  const handleConnectClick = (relay) => {
    relay.connect();
  };

  const handleDisconnectClick = (relay) => {
    relay.close();
  };

  const handleRemoveRelay = (relay) => {
    Nostr.removeRelay(relay.url);
  };

  const handleAddRelay = (event) => {
    event.preventDefault(); // prevent the form from reloading the page
    Nostr.addRelay(newRelayUrl); // add the new relay using the Nostr method
    setNewRelayUrl(""); // reset the new relay URL
  }

  const getStatus = (relay) => {
    try {
      return relay.status;
    } catch (e) {
      return 3;
    }
  }

  const getClassName = (relay) => {
    switch (getStatus(relay)) {
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

  let myPriv = iris.session.getKey().secp256k1.priv;
  if (myPriv) {
    myPriv = bech32.encode('nsec', Buffer.from(myPriv, 'hex'));
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
            {myPriv ? (
              <CopyButton
              copyStr={myPriv}
              text="Copy private key" />
            ) : (
              <p>Not present</p>
            )}

          </div>
        </div>
      </div>

      <h3>Relays</h3>
      <div id="peers" className="flex-table">
        {relays.map((relay) => (
          <div className="flex-row peer">
            <div className="flex-cell" key={relay.url}>
              <span className={getClassName(relay)}>&#x2B24; </span>
              {relay.url}
            </div>
            <div className="flex-cell no-flex">
              <Button onClick={() => handleRemoveRelay(relay)}>
                {t('remove')}
              </Button>
            </div>
            <div className="flex-cell no-flex">

              {getStatus(relay) === 1 ? (
                <Button onClick={() => handleDisconnectClick(relay)}>Disconnect</Button>
              ) : (
                <Button onClick={() => handleConnectClick(relay)}>Connect</Button>
              )}
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
      </div>
    </div>
  );
};

export default NostrSettings;