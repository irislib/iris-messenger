import { sha256 } from '@noble/hashes/sha256';
import { generatePrivateKey, getEventHash, getPublicKey, nip04, signEvent } from 'nostr-tools';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';
import AnimalName from '../../utils/AnimalName';

export const setGroupNameByInvite = (hexPriv, otherGuy) => {
  let name;
  const unsub = SocialNetwork.getProfile(otherGuy, (profile) => {
    name = profile.name;
  });
  setTimeout(() => {
    name = name || AnimalName(Key.toNostrBech32Address(otherGuy, 'npub') || '');
    localState.get('groups').get(getGroupId(hexPriv)).put({ name });
    unsub();
  }, 1000);
};

export const getGroupId = (key) => {
  const keyHash = sha256(key);
  return Array.from(keyHash, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);
};

export const addGroup = (
  key,
  navigate = true,
  inviter = null as any,
  name = undefined as string | undefined,
) => {
  const groupId = getGroupId(key);

  const saved = localState.get('groups').get(groupId).put({ key, inviter, name });
  navigate && saved.then(() => route(`/chat/${groupId}`));

  return groupId;
};

export const addChatWithInputKey = (inputKey, name = undefined as string | undefined) => {
  if (inputKey.indexOf('#') > -1) {
    inputKey = inputKey.split('#')[1];
  }
  if (inputKey.startsWith('nsec')) {
    const hexPriv = Key.toNostrHexAddress(inputKey);
    hexPriv && addGroup(hexPriv, true, undefined, name);
  }
};

const startNewGroup = (name = undefined as string | undefined) => {
  const newNostrKey = generatePrivateKey();
  return [addGroup(newNostrKey, true, undefined, name), newNostrKey];
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
  localState.get('chatInvites').get(recipient).put({ priv: groupPrivateKey });
  setGroupNameByInvite(groupPrivateKey, recipient);
};

export default function NewChat() {
  const [inputKey, setInputKey] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  const handleKeyInput = (e) => {
    setInputKey(e.target.value);
    addChatWithInputKey(e.target.value, newGroupName);
  };

  const handleGroupNameChange = (e) => {
    setNewGroupName(e.target.value);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <div className="flex flex-row gap-2">
        <input
          type="text"
          className="input rounded-full input-bordered"
          placeholder="Group name"
          onChange={handleGroupNameChange}
        />
        <button className="btn btn-primary" onClick={() => startNewGroup(newGroupName)}>
          {t('start_new_group')}
        </button>
      </div>
      <div className="my-4">{t('or')}</div>
      <div className="my-4 flex gap-2 justify-center items-center">
        <input
          placeholder="Paste nsec or chat link"
          type="password"
          id="pasteLink"
          className="text-center input input-bordered rounded-full p-2"
          onChange={handleKeyInput}
          value={inputKey}
        />
        {/*<button id="scanQR" className="btn btn-neutral" onClick={}>
          {t('Scan QR Code')}
        </button>*/}
      </div>
    </div>
  );
}
