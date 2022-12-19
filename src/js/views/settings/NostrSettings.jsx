import React, {useState} from "react";
import Nostr from "../../Nostr";
import Button from '../../components/basic/Button';
import iris from 'iris-lib';
import CopyButton from '../../components/CopyButton';

const NostrSettings = () => {
  const [relays, setRelays] = useState({});

  setInterval(() => {
    // console.log(111, Nostr.pool);
    setRelays(Nostr.pool.relays);
  }, 1000);

  const handleConnectClick = (relayId) => {
    // Connect to the selected relay
  };

  const handleDisconnectClick = (relayId) => {
    Nostr.pool.removeRelay(relayId);
  };

  return (
    <div className="centered-container">
      <h2>Nostr</h2>
      <h3>Key</h3>
      <div className="flex-table">
        <div className="flex-row">
          <div className="flex-cell">
            <p>Public key:</p>
            <input type="text" value={iris.session.getKey().secp256k1.rpub} />
          </div>
          <div className="flex-cell no-flex">
            <CopyButton
              copyStr={iris.session.getKey().secp256k1.rpub}
              text="Copy public key" />
          </div>
        </div>
        <div className="flex-row">
          <div className="flex-cell">
            Private key
          </div>
          <div className="flex-cell no-flex">
            <CopyButton
              copyStr={iris.session.getKey().secp256k1.priv}
              text="Copy private key" />
          </div>
        </div>
      </div>

      <h3>Relays</h3>
      <div id="peers" className="flex-table">
        {Object.keys(relays).map((id) => (
          <div className="flex-row peer">
            <div className="flex-cell" key={id}>
              {id}
            </div>
            <div className="flex-cell no-flex">
              {relays[id] ? (
                <Button onClick={() => handleDisconnectClick(id)}>Disconnect</Button>
              ) : (
                <Button onClick={() => handleConnectClick(id)}>Connect</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NostrSettings;