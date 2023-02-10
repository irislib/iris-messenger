import { html } from 'htm/preact';
import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Button from '../../components/basic/Button';
import CopyButton from '../../components/CopyButton';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';
import { ExistingAccountLogin } from '../Login';
const bech32 = require('bech32-buffer');

export default class AccountSettings extends Component {
  onLogoutClick(hasPriv) {
    if (hasPriv) {
      route('/logout'); // confirmation screen
    } else {
      Nostr.logOut();
    }
  }

  async onExtensionLoginClick(e) {
    e.preventDefault();
    const rpub = await window.nostr.getPublicKey();
    const k = await iris.Key.generate();
    k.secp256k1 = { rpub };
    iris.session.login(k);
  }

  render() {
    const myPrivHex = iris.session.getKey().secp256k1.priv;
    let myPriv32;
    if (myPrivHex) {
      // eslint-disable-next-line no-undef
      myPriv32 = bech32.encode('nsec', Buffer.from(myPrivHex, 'hex'));
    }
    const myPub = iris.session.getKey().secp256k1.rpub;
    // eslint-disable-next-line no-undef
    const myNpub = bech32.encode('npub', Buffer.from(myPub, 'hex'));

    const hasPriv = !!iris.session.getKey().secp256k1.priv;
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
          {this.state.showSwitchAccount ? html`
<p>
            <${ExistingAccountLogin} />
            </p>
            <p>
            <a href="" onClick=${(e) => this.onExtensionLoginClick(e)}>
              ${t('nostr_extension_login')}
            </a>
</p>

          ` : ''}

          <h3>{t('public_key')}</h3>
          <p>
            <small>{myNpub}</small>
          </p>
          <p>
            <CopyButton copyStr={myNpub} text="Copy npub" />
            <CopyButton copyStr={myPub} text="Copy hex" />
          </p>
          <h3>{t('private_key')}</h3>
          <p>
            {myPrivHex ? (
              <>
                <CopyButton notShareable={true} copyStr={myPriv32} text="Copy nsec" />
                <CopyButton notShareable={true} copyStr={myPrivHex} text="Copy hex" />
              </>
            ) : (
              <p>Not present. Good!</p>
            )}
          </p>
          {myPrivHex ? <p>{t('private_key_warning')}</p> : ''}
        </div>
      </>
    );
  }
}
