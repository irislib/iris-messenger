import { nip19 } from 'nostr-tools';
import { useCallback, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Show from '@/components/helpers/Show';

import Copy from '../../components/buttons/Copy';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation.mjs';
import Helpers from '../../utils/Helpers';
import ExistingAccountLogin from '../login/ExistingAccountLogin';

const Account = () => {
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);

  const onLogoutClick = useCallback((hasPriv) => {
    if (hasPriv) {
      route('/logout'); // confirmation screen
    } else {
      Session.logOut();
    }
  }, []);

  const onExtensionLoginClick = async (e) => {
    e.preventDefault();
    const rpub = await window.nostr.getPublicKey();
    Key.login({ rpub });
  };

  const deleteAccount = useCallback(() => {
    if (confirm(`${t('delete_account')}?`)) {
      Events.publish({
        kind: 0,
        content: JSON.stringify({ deleted: true }),
      });
      Events.publish({
        kind: 3,
        content: JSON.stringify({}),
      });
      setTimeout(() => {
        Session.logOut();
      }, 1000);
    }
  }, []);

  const myPrivHex = Key.getPrivKey();
  let myPriv32;
  if (myPrivHex) {
    myPriv32 = nip19.nsecEncode(myPrivHex);
  }
  const myPub = Key.getPubKey();
  const myNpub = nip19.npubEncode(myPub);
  const hasPriv = !!Key.getPrivKey();

  return (
    <div class="centered-container">
      <h2>{t('account')}</h2>
      <Show when={hasPriv}>
        <p>
          <b>{t('save_backup_of_privkey_first')}</b> {t('otherwise_cant_log_in_again')}
        </p>
      </Show>
      <div className="flex gap-2 my-2">
        <button className="btn btn-sm btn-primary" onClick={() => onLogoutClick(hasPriv)}>
          {t('log_out')}
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setShowSwitchAccount(!showSwitchAccount)}
        >
          {t('switch_account')}
        </button>
      </div>
      <Show when={showSwitchAccount}>
        <p>
          <ExistingAccountLogin onBack={() => setShowSwitchAccount(false)} />
        </p>
        <p>
          <a href="#" onClick={onExtensionLoginClick}>
            {t('nostr_extension_login')}
          </a>
        </p>
      </Show>
      <h3>{t('public_key')}</h3>
      <p>
        <small>{myNpub}</small>
      </p>
      <div className="flex gap-2 my-2">
        <Copy className="btn btn-neutral btn-sm" copyStr={myNpub} text="Copy npub" />
        <Copy className="btn btn-neutral btn-sm" copyStr={myPub} text="Copy hex" />
      </div>
      <h3>{t('private_key')}</h3>
      <div className="flex gap-2 my-2">
        <Show when={myPrivHex}>
          <>
            <Copy className="btn btn-neutral btn-sm" copyStr={myPriv32} text="Copy nsec" />
            <Copy className="btn btn-neutral btn-sm" copyStr={myPrivHex} text="Copy hex" />
          </>
        </Show>
        <Show when={!myPrivHex}>
          <p>{t('private_key_not_present_good')}</p>
        </Show>
      </div>
      <Show when={myPrivHex}>
        <p>{t('private_key_warning')}</p>
      </Show>
      <Show when={Helpers.isStandalone()}>
        <h3>{t('delete_account')}</h3>
        <p>
          <button className="btn btn-sm btn-danger" onClick={deleteAccount}>
            {t('delete_account')}
          </button>
        </p>
      </Show>
    </div>
  );
};

export default Account;
