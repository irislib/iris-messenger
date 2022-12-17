import React, {useState} from "react";

const NostrSettings = () => {
  const [relayConnections, setRelayConnections] = useState({});

  const relays = [
    { id: 1, url: 'https://relay1.com' },
    { id: 2, url: 'https://relay2.com' },
    { id: 3, url: 'https://relay3.com' },
  ];

  const handleConnectClick = (relayId) => {
    // Connect to the selected relay
    setRelayConnections({ ...relayConnections, [relayId]: true });
  };

  const handleDisconnectClick = (relayId) => {
    // Disconnect from the selected relay
    setRelayConnections({ ...relayConnections, [relayId]: false });
  };

  return (
    <div className="centered-container">
      <h2>Nostr</h2>
      <h3>Relays</h3>
      <ul>
        {relays.map((relay) => (
          <li key={relay.id}>
            {relay.url}
            {relayConnections[relay.id] ? (
              <button onClick={() => handleDisconnectClick(relay.id)}>Disconnect</button>
            ) : (
              <button onClick={() => handleConnectClick(relay.id)}>Connect</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NostrSettings;