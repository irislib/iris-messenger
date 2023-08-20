import React, { useState } from 'react';

import { RouteProps } from '@/views/types.ts';

import Header from '../components/Header';
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
      <div class="main-view" id="settings">
        <div class="centered-container mobile-padding15">
          <h2>{t('key_converter')}</h2>
          <p>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="Enter hex or bech32 key"
              onInput={(e) => setKey((e.target as HTMLInputElement).value?.trim())}
            />
          </p>
          {key &&
            hex &&
            (key === hex ? (
              <>
                <p>
                  <b>note:</b> {note}
                </p>
                <p>
                  <b>npub:</b> {npub}
                </p>
                <p>
                  <b>nsec:</b> {nsec}
                </p>
              </>
            ) : (
              <p>
                <b>hex:</b> {hex}
              </p>
            ))}
          {key && !hex && (
            <p>
              <b>Invalid key</b>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default KeyConverter;
