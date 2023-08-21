import React, { useState } from 'react';

import { Hex } from '@/utils/Hex/Hex.ts';
import { RouteProps } from '@/views/types.ts';

import Header from '../components/header/Header.tsx';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

const KeyConverter: React.FC<RouteProps> = () => {
  const [key, setKey] = useState('');

  let hex;
  let note;
  let npub;
  let nsec;
  try {
    hex = new Hex(Key.toNostrHexAddress(key) || key);
    note = hex.toBech32('note');
    npub = hex.toBech32('npub');
    nsec = Key.toNostrBech32Address(key, 'nsec');
  } catch (e) {
    hex = null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen" id="settings">
        <div className="flex flex-col items-center justify-center py-5 px-4 sm:px-8">
          <h2 className="text-2xl font-bold mb-5">{t('key_converter')}</h2>
          <div className="w-full max-w-lg">
            <input
              type="text"
              className="input input-bordered w-full text-center text-sm"
              placeholder="Enter hex or bech32 key"
              onInput={(e) => setKey((e.target as HTMLInputElement).value?.trim())}
            />
          </div>
          {key &&
            hex &&
            (key === hex.toHex() ? (
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
                <span className="font-bold">hex:</span> {hex.toHex()}
              </p>
            ))}
          {key && !hex && <p className="mt-3 text-red-500 font-bold">Invalid key</p>}
        </div>
      </div>
    </>
  );
};

export default KeyConverter;
