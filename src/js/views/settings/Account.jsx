import { html } from 'htm/preact';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Button from '../../components/buttons/Button';
import Copy from '../../components/buttons/Copy';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation';
import { ExistingAccountLogin } from '../Login';
import Helpers from "../../Helpers";
const bech32 = require('bech32-buffer');

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
      myPriv32 = bech32.encode('nsec', Buffer.from(myPrivHex, 'hex'));
    }
    const myPub = Key.getPubKey();
    // eslint-disable-next-line no-undef
    const myNpub = bech32.encode('npub', Buffer.from(myPub, 'hex'));

    const hasPriv = !!Key.getPrivKey();
    return (
      <>
        <div class="centered-container">
          <h2>{t('account')}</h2>
          <p>
            {hasPriv ? (
              <>
                <b>{t('save_backup_of_privkey_first')}</b> {t('otherwise_cant_log_in_again')}
              </>
            ) : null}
          </p>
          <p>
            <Button onClick={() => this.onLogoutClick(hasPriv)}>{t('log_out')}</Button>
            <Button
              onClick={() =>
                this.setState({
                  showSwitchAccount: !this.state.showSwitchAccount,
                })
              }
            >
              {t('switch_account')}
            </Button>
          </p>
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
          <p>
            <Copy copyStr={myNpub} text="Copy npub" />
            <Copy copyStr={myPub} text="Copy hex" />
          </p>
          <h3>{t('private_key')}</h3>
          <p>
            {myPrivHex ? (
              <>
                <Copy copyStr={myPriv32} text="Copy nsec" />
                <Copy copyStr={myPrivHex} text="Copy hex" />
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
                <Button onClick={() => this.deleteAccount()}>{t('delete_account')}</Button>
              </p>
            </>
          ) : null}
        </div>
      </>
    );
  }
}
