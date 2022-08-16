import { html } from 'htm/preact';
import Helpers from '../../Helpers';
import _ from 'lodash';
import Component from '../../BaseComponent';
import {ExistingAccountLogin} from '../Login';
import {translate as t} from '../../Translation';
import { route } from 'preact-router';
//import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import CopyButton from '../../components/CopyButton';
import Session from '../../Session';

export default class KeySettings extends Component {

    constructor(){
        super();
        this.state = Session.DEFAULT_SETTINGS;
    }

    mailtoSubmit(e) {
        e.preventDefault();
        if (this.state.email && this.state.email === this.state.retypeEmail) {
          window.location.href = `mailto:${this.state.email}?&subject=Iris%20private%20key&body=${JSON.stringify(Session.getKey())}`;
        }
      }

  render() {
    return (
        <>
        <div class="centered-container">
        <h4>{t('private_key')}</h4>
        <p dangerouslySetInnerHTML={{ __html: t('private_key_warning') }} ></p>
        <p>
          <button onClick={() => downloadKey()}>{t('download_private_key')}</button>
          <CopyButton notShareable={true} text={t('copy_private_key')} copyStr={JSON.stringify(Session.getKey())}/>
        </p>
        <p>
          <button onClick={e => togglePrivateKeyQR(e)}>{t('show_privkey_qr')}</button>
        </p>
        <div id="private-key-qr" class="qr-container"></div>
        <p>
          {t('email_privkey_to_yourself')}:
        </p>
        <p>
          <form onSubmit={e => this.mailtoSubmit(e)}>
            <input name="email" type="email" onChange={e => this.setState({email:e.target.value.trim()})} placeholder={t('email')}/>
            <input name="verify_email" type="email" onChange={e => this.setState({retypeEmail:e.target.value.trim()})} placeholder={t('retype_email')}/>
            <button type="submit">${t('go')}</button>
          </form>
        </p>
        <p><small dangerouslySetInnerHTML={{ __html: t('privkey_storage_recommendation')}}></small></p>
        </div>
        </>
    );
  }
  
}
function downloadKey() {
  const key = Session.getKey();
  delete key['#'];
  return Helpers.download('iris_private_key.txt', JSON.stringify(key), 'text/plain', 'utf-8');
}