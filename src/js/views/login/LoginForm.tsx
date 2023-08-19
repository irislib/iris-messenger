import { useState } from 'react';
import { useEffect } from 'preact/hooks';

import Show from '@/components/helpers/Show.tsx';
import LanguageSelector from '@/components/LanguageSelector';
import Key from '@/nostr/Key.ts';
import { translate as t } from '@/translations/Translation.mjs';

type LoginFormProps = {
  onSubmit: () => void;
  onNameChange: (name: string) => void;
  onShowSwitchAccount: () => void;
};

async function onNostrExtensionLogin(e) {
  e.preventDefault();
  const rpub = await window.nostr.getPublicKey();
  Key.login({ rpub });
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onNameChange, onShowSwitchAccount }) => {
  const [hasNostr, setHasNostr] = useState(!!window.nostr);
  const [name, setName] = useState('');

  useEffect(() => {
    const el = document.getElementById('login-form-name');
    el && el.focus();

    // Checking for nostr and updating state
    if (window.nostr) {
      setHasNostr(true);
    }

    // Consider removing these timeouts if they're not needed anymore.
    setTimeout(() => {
      if (window.nostr) setHasNostr(true);
    }, 100);

    setTimeout(() => {
      if (window.nostr) setHasNostr(true);
    }, 1000);

    // Optionally, you could also add an event listener for a custom event that you dispatch when `window.nostr` is set.
    // This would be more efficient than just setting timeouts.
  }, []);

  return (
    <form
      className="shadow-md bg-black rounded px-8 pt-6 pb-8 mb-4 gap-4 flex flex-col items-center justify-center"
      autocomplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <img className="w-20 h-20 mx-auto" src="/img/android-chrome-192x192.png" alt="iris" />
      <h1 className="text-2xl font-bold">iris</h1>
      <input
        className={`input centered-placeholder ${name.length ? 'text-center' : ''}`}
        onInput={(e: any) => {
          const val = e.target?.value;
          setName(val);
          onNameChange(val);
        }}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="sentences"
        spellcheck={false}
        id="login-form-name"
        type="text"
        name="name"
        placeholder={t('whats_your_name')}
      />
      <p className="my-2">
        <button className="btn btn-primary" type="submit">
          {t('new_user_go')}
        </button>
      </p>
      <Show when={hasNostr}>
        <p className="text-center link">
          <a
            href=""
            onClick={(e) => {
              e.preventDefault();
              onNostrExtensionLogin(e);
            }}
          >
            {t('nostr_extension_login')}
          </a>
        </p>
      </Show>
      <p className="text-center link">
        <a
          href=""
          id="show-existing-account-login"
          onClick={(e) => {
            e.preventDefault();
            onShowSwitchAccount();
          }}
        >
          {t('private_key_login')}
        </a>
      </p>
      <LanguageSelector />
    </form>
  );
};

export default LoginForm;
