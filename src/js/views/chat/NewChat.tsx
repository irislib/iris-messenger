import { generatePrivateKey } from 'nostr-tools';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

import localState from '../../LocalState';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

export default function NewChat() {
  const [inputKey, setInputKey] = useState('');

  const createNewGroup = (key) => {
    const randomChatID = Math.floor(Math.random() * 1000000000);
    localState.get('groups').get(randomChatID).put({ key });
    route(`/chat/${randomChatID}`);
  };

  const startNewGroup = () => {
    const newNostrKey = generatePrivateKey();
    createNewGroup(newNostrKey);
  };

  const handleInput = (e) => {
    setInputKey(e.target.value);
    addChatWithInputKey();
  };

  const addChatWithInputKey = () => {
    if (inputKey.startsWith('nsec')) {
      const hexPriv = Key.toNostrHexAddress(inputKey);
      hexPriv && createNewGroup(hexPriv);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <button className="btn btn-primary" onClick={startNewGroup}>
        {t('start_new_group')}
      </button>
      <div className="my-4">{t('or')}</div>
      <div className="my-4 flex gap-2 justify-center items-center">
        <input
          placeholder="Paste nsec or chat link"
          type="password"
          id="pasteLink"
          className="text-center input border border-gray-400 rounded-full p-2"
          onInput={handleInput}
          value={inputKey}
        />
        {/*<button id="scanQR" className="btn btn-neutral" onClick={}>
          {t('Scan QR Code')}
        </button>*/}
      </div>
    </div>
  );
}
