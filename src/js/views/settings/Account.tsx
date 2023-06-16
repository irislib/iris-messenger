import { html } from 'htm/preact';
import { nip19 } from 'nostr-tools';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import { PrimaryButton as Button } from '../../components/buttons/Button';
import Copy from '../../components/buttons/Copy';
import Helpers from '../../Helpers';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation.mjs';
import { ExistingAccountLogin } from '../Login';

export default class Account extends Component {
  onLogoutClick(hasPriv) {
    if (hasPriv) {
      route('/logout'); // confirmation screen
    } else {
      Session.logOut();
    }
  }

  async onExtensionLoginClick(e) {
    e.preventDefault();
    const rpub = await window.nostr.getPublicKey();
    Key.login({ rpub });
  }

  deleteAccount() {
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
  }

  render() {
    const myPrivHex = Key.getPrivKey();
    let myPriv32;
    if (myPrivHex) {
      // eslint-disable-next-line no-undef
      myPriv32 = nip19.nsecEncode(myPrivHex);
    }
    const myPub = Key.getPubKey();
    // eslint-disable-next-line no-undef
    const myNpub = nip19.npubEncode(myPub);

    const hasPriv = !!Key.getPrivKey();
    return (
      <>
        <div class="centered-container">
          <h2>{t('account')}</h2>
          {hasPriv ? (
            <p>
              <b>{t('save_backup_of_privkey_first')}</b> {t('otherwise_cant_log_in_again')}
            </p>
          ) : null}
          <div className="flex gap-2 my-2">
            <button className="btn btn-sm btn-primary" onClick={() => this.onLogoutClick(hasPriv)}>
              {t('log_out')}
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() =>
                this.setState({
                  showSwitchAccount: !this.state.showSwitchAccount,
                })
              }
            >
              {t('switch_account')}
            </button>
          </div>
          {this.state.showSwitchAccount
            ? html`
                <p>
                  <${ExistingAccountLogin} />
                </p>
                <p>
                  <a href="" onClick=${(e) => this.onExtensionLoginClick(e)}>
                    ${t('nostr_extension_login')}
                  </a>
                </p>
              `
            : ''}

          <h3>{t('public_key')}</h3>
          <p>
            <small>{myNpub}</small>
          </p>
          <div className="flex gap-2 my-2">
            <Copy className="btn btn-neutral btn-sm" copyStr={myNpub} text="Copy npub" />
            <Copy className="btn btn-neutral btn-sm" copyStr={myPub} text="Copy hex" />
          </div>
          <h3>{t('private_key')}</h3>
          <p>
            {myPrivHex ? (
              <>
                <Copy className="btn btn-neutral btn-sm" copyStr={myPriv32} text="Copy nsec" />
                <Copy className="btn btn-neutral btn-sm" copyStr={myPrivHex} text="Copy hex" />
              </>
            ) : (
              <p>{t('private_key_not_present_good')}</p>
            )}
          </p>
          {myPrivHex ? <p>{t('private_key_warning')}</p> : ''}

          {Helpers.isStandalone() ? (
            <>
              <h3>{t('delete_account')}</h3>
              <p>
                <button className="btn btn-sm btn-danger" onClick={() => this.deleteAccount()}>
                  {t('delete_account')}
                </button>
              </p>
            </>
          ) : null}
        </div>
      </>
    );
  }
}
