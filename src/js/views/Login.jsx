import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation';
import LanguageSelector from '../components/LanguageSelector';
import QRScanner from '../QRScanner';
import Session from '../Session';
import { Component } from 'preact';
import logo from '../../assets/img/android-chrome-192x192.png';
import Button from '../components/basic/Button';

class Login extends Component {
  componentDidMount() {
    const el = document.getElementById('login-form-name');
    el && el.focus();
  }

  toggleScanPrivKey() {
    if (this.state.showScanPrivKey) {
      QRScanner.cleanupScanner();
    } else {
      QRScanner.startPrivKeyQRScanner().then(Session.login);
    }
    this.setState({showScanPrivKey: !this.state.showScanPrivKey});
  }

  onPastePrivKey(event) {
    const val = event.target.value;
    if (!val.length) { return; }
    try {
      let k = JSON.parse(val);
      Session.login(k);
      event.target.value = '';
      Helpers.copyToClipboard(''); // clear the clipboard
    } catch (e) {
      console.error('Login with key', val, 'failed:', e);
    }
  }

  showCreateAccount(e) {
    e.preventDefault();
    QRScanner.cleanupScanner();
    this.setState({showSwitchAccount: false});
  }

  onLoginFormSubmit(e) {
    e.preventDefault();
    let name = document.getElementById('login-form-name').value || Helpers.generateName();
    Session.loginAsNewUser(name);
    this.base.style = 'display:none';
  }

  onNameChange(event) {
    const val = event.target.value;
    if (val.indexOf('"priv"') !== -1) {
      this.onPastePrivKey(event);
      event.target.value = '';
      return;
    }
    this.setState({inputStyle: val.length ? "text-align: center" : ""})
  }

  renderExistingAccountLogin() {
    return (
      <>
        <input id="paste-privkey" autoFocus onInput={e => this.onPastePrivKey(e)}
               placeholder={t('paste_private_key')} />
        <p>
          <Button id="scan-privkey-btn"
                  onClick={e => this.toggleScanPrivKey(e)}>{t('scan_private_key_qr_code')}</Button>
        </p>
        <p>
          <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;"
                 className={this.state.showScanPrivKey ? '' : 'hidden'} />
        </p>
      </>
    );
  }

  render() {
    return (<section id="login">
      <div id="login-content">
        {!this.state.showSwitchAccount ? (
          <form id="login-form" autocomplete="off" onSubmit={e => this.onLoginFormSubmit(e)}>
            <div id="create-account">
              <img width="86" height="86" src={logo} alt="iris" />
              <h1>iris</h1>
              <input style={this.state.inputStyle} onInput={e => this.onNameChange(e)} autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off" id="login-form-name" type="text" name="name" placeholder={t('whats_your_name')} />
              <p><Button id="sign-up" type="submit">{t('new_user_go')}</Button></p>
              <br />
              <p><a href="#" id="show-existing-account-login" onClick={() => this.setState({showSwitchAccount: true})}>{t('already_have_an_account')}</a></p>
              <p><a href="#" onClick={() => Session.ethereumLogin()}>{t('web3_login')}</a></p>
              <p>
                <LanguageSelector />
              </p>
            </div>
          </form>
        ):(
          <div id="existing-account-login">
            <p><a href="#" id="show-create-account" onClick={e => this.showCreateAccount(e)}>> {t('back')}</a></p>
            {this.renderExistingAccountLogin()}
          </div>
        )}
      </div>
    </section>);
  }
}

class ExistingAccountLogin extends Login {
  render() {
    return this.renderExistingAccountLogin();
  }
}

export {ExistingAccountLogin};
export default Login;
