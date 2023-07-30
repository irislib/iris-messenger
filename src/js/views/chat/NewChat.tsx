import { sha256 } from '@noble/hashes/sha256';
import { generatePrivateKey, getEventHash, getPublicKey, nip04, signEvent } from 'nostr-tools';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

export const addGroup = (key, navigate = true, inviter = null) => {
  const keyHash = sha256(key);
  const groupId = Array.from(keyHash, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);

  localState.get('groups').get(groupId).put({ key, inviter });
  navigate && route(`/chat/${groupId}`);
  return groupId;
};

export const addChatWithInputKey = (inputKey) => {
  if (inputKey.indexOf('#') > -1) {
    inputKey = inputKey.split('#')[1];
  }
  if (inputKey.startsWith('nsec')) {
    const hexPriv = Key.toNostrHexAddress(inputKey);
    hexPriv && addGroup(hexPriv);
  }
};

const startNewGroup = () => {
  const newNostrKey = generatePrivateKey();
  return [addGroup(newNostrKey), newNostrKey];
};

export const sendSecretInvite = async (recipient) => {
  const groupPrivateKey = startNewGroup()[1];
  const nsec = Key.toNostrBech32Address(groupPrivateKey, 'nsec');
  const anonymousInviterKey = generatePrivateKey();
  const kind = 4;
  const created_at = Math.floor(Date.now() / 1000);
  const content = `This is an invitation to a secret chat. Use ${nsec} or go to https://iris.to/chat/#${nsec}`;

  let innerEvent = {
    kind,
    created_at,
    pubkey: Key.getPubKey(),
    tags: [['p', recipient]],
    content,
  };
  innerEvent = await Events.sign(innerEvent);

  const encryptedContent = await nip04.encrypt(
    anonymousInviterKey,
    recipient,
    `${content}\n\n${JSON.stringify(innerEvent)}`,
  );
  const event = {
    kind,
    created_at,
    pubkey: getPublicKey(anonymousInviterKey),
    tags: [['p', recipient]],
    content: encryptedContent,
  } as any;
  event.id = getEventHash(event);
  event.sig = signEvent(event, anonymousInviterKey);
  Events.publish(event);
};

export default function NewChat() {
  const [inputKey, setInputKey] = useState('');

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
