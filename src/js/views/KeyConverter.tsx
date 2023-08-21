import React, { useState } from 'react';

import { RouteProps } from '@/views/types.ts';

import Header from '../components/header/Header.tsx';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

const KeyConverter: React.FC<RouteProps> = () => {
  const [key, setKey] = useState('');

  const hex = Key.toNostrHexAddress(key);
  const note = Key.toNostrBech32Address(key, 'note');
  const npub = Key.toNostrBech32Address(key, 'npub');
  const nsec = Key.toNostrBech32Address(key, 'nsec');

  return (
    <>
      <Header />
      <div className="min-h-screen" id="settings">
        <div className="flex flex-col items-center justify-center py-5 px-4 sm:px-8">
          <h2 className="text-2xl font-bold mb-5">{t('key_converter')}</h2>
          <div className="w-full max-w-md">
            <input
              type="text"
              className="input input-bordered w-full text-center"
              placeholder="Enter hex or bech32 key"
              onInput={(e) => setKey((e.target as HTMLInputElement).value?.trim())}
            />
          </div>
          {key &&
            hex &&
            (key === hex ? (
              <>
                <p className="mt-3">
                  <span className="font-bold">note:</span> {note}
                </p>
                <p className="mt-1">
                  <span className="font-bold">npub:</span> {npub}
                </p>
                <p className="mt-1">
                  <span className="font-bold">nsec:</span> {nsec}
                </p>
              </>
            ) : (
              <p className="mt-3">
                <span className="font-bold">hex:</span> {hex}
              </p>
            ))}
          {key && !hex && <p className="mt-3 text-red-500 font-bold">Invalid key</p>}
        </div>
      </div>
    </>
  );
};

export default KeyConverter;
