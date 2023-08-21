import { useEffect, useState } from 'react';

import localState from '../../state/LocalState.ts';

export default function DevSettings() {
  const [state, setState] = useState({});

  useEffect(() => {
    const unsubscribe = localState.get('dev').on((data) => setState(data));
    return () => unsubscribe();
  }, []);

  const renderCheckbox = (key, label, defaultValue) => (
    <p>
      <input
        type="checkbox"
        id={key}
        checked={state[key] === undefined ? defaultValue : state[key]}
        onChange={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          localState.get('dev').get(key).put(checked);
        }}
      />
      <label htmlFor={key}>{label}</label>
    </p>
  );

  const checkboxes = [
    {
      key: 'logSubscriptions',
      label: 'Log RelayPool subscriptions',
      defaultValue: false,
    },
    {
      key: 'indexedDbSave',
      label: 'Save events to IndexedDB',
      defaultValue: true,
    },
    {
      key: 'indexedDbLoad',
      label: 'Load events from IndexedDB',
      defaultValue: true,
    },
    {
      key: 'askEventsFromRelays',
      label: 'Ask events from relays',
      defaultValue: true,
    },
  ];

  return (
    <div class="centered-container">
      <h3>Developer</h3>
      <p>Settings intended for Iris developers.</p>
      {checkboxes.map(({ key, label, defaultValue }) => renderCheckbox(key, label, defaultValue))}
    </div>
  );
}
