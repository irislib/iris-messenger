import { sha256 } from '@noble/hashes/sha256';
import { generatePrivateKey } from 'nostr-tools';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

import localState from '../../LocalState';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

export const addGroup = (key) => {
  const keyHash = sha256(key);
  const groupId = Array.from(keyHash, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);

  localState.get('groups').get(groupId).put({ key });
  route(`/chat/${groupId}`);
};

export const addChatWithInputKey = (inputKey) => {
  if (inputKey.startsWith('nsec')) {
    const hexPriv = Key.toNostrHexAddress(inputKey);
    hexPriv && addGroup(hexPriv);
  }
};

export default function NewChat() {
  const [inputKey, setInputKey] = useState('');

  const startNewGroup = () => {
    const newNostrKey = generatePrivateKey();
    addGroup(newNostrKey);
  };

  const handleInput = (e) => {
    console.log(111, e.target.value);
    setInputKey(e.target.value);
    addChatWithInputKey(e.target.value);
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
          onChange={handleInput}
          value={inputKey}
        />
        {/*<button id="scanQR" className="btn btn-neutral" onClick={}>
          {t('Scan QR Code')}
        </button>*/}
      </div>
    </div>
  );
}
