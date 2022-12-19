import React, {useState} from "react";
import Nostr from "../../Nostr";
import Button from '../../components/basic/Button';

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