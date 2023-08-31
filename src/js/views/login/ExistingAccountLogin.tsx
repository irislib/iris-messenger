import { secp256k1 } from '@noble/curves/secp256k1';
import { bech32 } from 'bech32';
import { useCallback, useState } from 'preact/hooks';

import Key from '@/nostr/Key';
import { translate as t } from '@/translations/Translation.mjs';
import Helpers from '@/utils/Helpers';

type Props = {
  fullScreen?: boolean;
  onBack: () => void;
};

const ExistingAccountLogin: React.FC<Props> = ({ fullScreen, onBack }) => {
  const [privateKeyError, setPrivateKeyError] = useState<string | null>(null);

  const onPasteKey = useCallback(
    async (event) => {
      const val = event.target.value?.trim();
      let k;

      if (!val.length) {
        setPrivateKeyError(null);
        return;
      }
      try {
        k = JSON.parse(val);
      } catch (e) {
        /* empty */
      }
      if (!k) {
        if (secp256k1.utils.isValidPrivateKey(val)) {
          k = { priv: val, rpub: Key.getPublicKey(val) };
        } else {
          try {
            const { words, prefix } = bech32.decode(val);
            const data = new Uint8Array(bech32.fromWords(words));
            const hex = Helpers.arrayToHex(data);
            if (prefix === 'npub') {
              k = { rpub: hex };
            } else if (prefix === 'nsec') {
              k = { priv: hex, rpub: Key.getPublicKey(hex) };
            }
          } catch (e) {
            setPrivateKeyError(t('invalid_private_key'));
            console.error(e);
          }
        }
      }
      if (!k) {
        return;
      }
      await Key.login(k);
      event.target.value = '';
      Helpers.copyToClipboard(''); // clear the clipboard
    },
    [fullScreen],
  );

  return (
    <div className="text-center shadow-md rounded px-8 pt-6 pb-8 mb-4 flex gap-2 flex-col">
      <p className="link">
        <a
          href=""
          id="show-create-account"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
        >
          {t('back')}
        </a>
      </p>
      <input
        className="rounded-full input input-bordered centered-placeholder"
        id="paste-privkey"
        autoFocus
        onInput={onPasteKey}
        placeholder={t('paste_private_key')}
        type="password"
      />
      {privateKeyError && <p className="error">{privateKeyError}</p>}
    </div>
  );
};

export default ExistingAccountLogin;
