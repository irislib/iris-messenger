import React, { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getEventHash, getSignature, nip04 } from 'nostr-tools';

import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';

interface ChatMessageFormProps {
  activeChat: string;
  class?: string;
  autofocus?: boolean;
  onSubmit?: () => void;
  keyPair?: { pubKey: string; privKey: string };
}

const ChatMessageForm: React.FC<ChatMessageFormProps> = ({
  activeChat,
  class: classProp,
  autofocus,
  onSubmit,
  keyPair,
}) => {
  const [message, setMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!Helpers.isMobile && autofocus !== false) {
      inputRef.current?.focus();
    }
  }, [autofocus]);

  const privateEncrypt = (text: string) => {
    try {
      const theirPub = Key.toNostrHexAddress(activeChat);
      if (!theirPub) {
        throw new Error('invalid public key ' + theirPub);
      }
      return Key.encrypt(text, theirPub);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.length) {
      return;
    }

    const kind = 4;
    const created_at = Math.floor(Date.now() / 1000);
    const event = { kind, created_at } as any;
    if (keyPair) {
      // group message
      let innerEvent = { kind, created_at, content: message, tags: [['p', keyPair.pubKey]] };
      innerEvent = await Events.sign(innerEvent);
      event.content = await nip04.encrypt(
        keyPair.privKey,
        keyPair.pubKey,
        `${message}\n\n${JSON.stringify(innerEvent)}`,
      );
      event.pubkey = keyPair.pubKey;
      event.tags = [['p', keyPair.pubKey]];
      console.log('event', event);
      event.id = getEventHash(event);
      event.sig = getSignature(event, keyPair.privKey);
    } else {
      const recipient = Key.toNostrHexAddress(activeChat);
      event.content = await privateEncrypt(message);
      event.tags = [['p', recipient]];
      if (!recipient) {
        throw new Error('invalid public key ' + recipient);
      }
    }

    Events.publish(event);

    setMessage('');

    onSubmit?.();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    localState.get('channels').get(activeChat).get('msgDraft').put(value);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <form
      autoComplete="off"
      className={`flex flex-1 flex-row gap-2 p-2 message-form sticky w-full bottom-0 w-96 max-w-screen bg-black ${
        classProp || ''
      }`}
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        className="input input-sm flex-1 new-msg"
        onInput={handleInputChange}
        onKeyDown={handleKeyDown}
        type="text"
        placeholder="Type a message"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={true}
        value={message}
      />
      <button className="btn btn-neutral btn-sm" style={{ marginRight: '0' }}>
        <PaperAirplaneIcon width="24" />
      </button>
    </form>
  );
};

export default ChatMessageForm;
