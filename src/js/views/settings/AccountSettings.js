import { html } from 'htm/preact';
import _ from 'lodash';
import Component from '../../BaseComponent';
import {ExistingAccountLogin} from '../Login';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';
//import { BrowserRouter as Router, Route, Link } from "react-router-dom";

export default class AccountSettings extends Component {

  render() {
    return (
        <>
        <div class="centered-container">
        <h3>{t('account')}</h3>
        <p>
          <b>{t('save_backup_of_privkey_first')}</b> {t('otherwise_cant_log_in_again')}
        </p>
        <p>
          <button onClick={() => route('/logout')}>{t('log_out')}</button>
        </p>
        <p>
          <button onClick={() => this.setState({showSwitchAccount: !this.state.showSwitchAccount})}>{t('switch_account')}</button>
        </p>
        {this.state.showSwitchAccount ? html`<${ExistingAccountLogin}/>` : ''}
        </div>
        </>
    );
  }
}