import { html } from 'htm/preact';
import iris from 'iris-lib';
import { route } from 'preact-router';

import Component from '../../BaseComponent';
import Button from '../../components/basic/Button';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';
import { ExistingAccountLogin } from '../Login';

export default class AccountSettings extends Component {
  onLogoutClick(hasPriv) {
    if (hasPriv) {
      route('/logout'); // confirmation screen
    } else {
      Nostr.logOut();
    }
  }

  render() {
    const hasPriv = !!iris.session.getKey().secp256k1.priv;
    return (
      <>
        <div class="centered-container">
          <h3>{t('account')}</h3>
          <p>
            {hasPriv ? (
              <>
                <b>{t('save_backup_of_privkey_first')}</b> {t('otherwise_cant_log_in_again')}
              </>
            ) : null}
          </p>
          <div style="">
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
          </div>
          {this.state.showSwitchAccount ? html`<${ExistingAccountLogin} />` : ''}
        </div>
      </>
    );
  }
}
