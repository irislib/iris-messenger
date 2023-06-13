import * as secp from '@noble/secp256k1';
import * as bech32 from 'bech32-buffer';
import { Component } from 'preact';

import logo from '../../../public/img/android-chrome-192x192.png';
import EULA from '../components/EULA';
import LanguageSelector from '../components/LanguageSelector';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

type Props = {
  fullScreen?: boolean;
};

type State = {
  showSwitchAccount: boolean;
  privateKeyError: string | null;
  showEula: boolean;
  inputStyle: any;
};

class Login extends Component<Props, State> {
  state = {
    showSwitchAccount: false,
    privateKeyError: null,
    showEula: false,
    inputStyle: null as any,
  };

  componentDidMount() {
    const el = document.getElementById('login-form-name');
    el && el.focus();
    // re-render after a while sec to make sure window.nostr is set
    setTimeout(() => this.setState({}), 100);
    setTimeout(() => this.setState({}), 1000);
  }

  async nostrExtensionLogin(event) {
    event.preventDefault();
    const rpub = await window.nostr.getPublicKey();
    Key.login({ rpub }, this.props.fullScreen);
  }

  async onPasteKey(event) {
    const val = event.target.value?.trim();
    if (!val.length) {
      this.setState({ privateKeyError: null });
      return;
    }
    let k;
    try {
      // old format iris keys were json { priv, pub, epub, epriv }
      // with nostr, secp256k1: { rpub, priv } was added to it
      k = JSON.parse(val);
    } catch (e) {
      /* empty */
    }
    if (!k) {
      // logging in with a hex private key?
      // TODO ask user if it's a private or public key
      if (secp.utils.isValidPrivateKey(val)) {
        k = { priv: val, rpub: Key.getPublicKey(val) };
      } else {
        try {
          const { data, prefix } = bech32.decode(val);
          const hex = Helpers.arrayToHex(data);
          // logging in with a public key?
          if (prefix === 'npub') {
            k = { rpub: hex };
          } else if (prefix === 'nsec') {
            // logging in with a bech32 private key (nsec)
            k = { priv: hex, rpub: Key.getPublicKey(hex) };
          }
        } catch (e) {
          this.setState({ privateKeyError: t('invalid_private_key') });
          console.error(e);
        }
      }
    }
    if (!k) {
      return;
    }
    await Key.login(k, this.props.fullScreen);
    event.target.value = '';
    Helpers.copyToClipboard(''); // clear the clipboard
  }

  showCreateAccount(e) {
    e.preventDefault();
    this.setState({ showSwitchAccount: false });
  }

  loginAsNewUser() {
    const element = document.getElementById('login-form-name') as HTMLInputElement;
    const display_name = element?.value;
    Key.loginAsNewUser(this.props.fullScreen);
    localState.get('showFollowSuggestions').put(true);
    display_name &&
      setTimeout(() => {
        SocialNetwork.setMetadata({ display_name });
      }, 100);
    // follow the developer's nostr key also
    const now = Math.floor(Date.now() / 1000);
    Events.notificationsSeenTime = now;
  }

  onLoginFormSubmit(e) {
    e.preventDefault();
    if (Helpers.isStandalone()) {
      this.setState({ showEula: true });
    } else {
      this.loginAsNewUser();
    }
  }

  onNameChange(event) {
    const val = event.target.value;
    if (
      val.indexOf('"priv"') !== -1 ||
      secp.utils.isValidPrivateKey(val) ||
      val.startsWith('nsec') ||
      val.startsWith('npub')
    ) {
      this.onPasteKey(event);
      event.target.value = '';
      return;
    }
    this.setState({ inputStyle: val.length ? 'text-align: center' : '' });
  }

  renderExistingAccountLogin() {
    return (
      <>
        <input
          id="paste-privkey"
          autoFocus
          onInput={(e) => this.onPasteKey(e)}
          placeholder={t('paste_private_key')}
          type="password"
        />
        {this.state.privateKeyError && <p className="error">{this.state.privateKeyError}</p>}
      </>
    );
  }

  render() {
    return (
      <section
        className={`flex items-center justify-center ${this.props.fullScreen ? 'h-screen' : ''}`}
      >
        {this.state.showEula && (
          <EULA
            onAccept={() => this.loginAsNewUser()}
            onDecline={() => this.setState({ showEula: false })}
          />
        )}
        <div className="w-full max-w-sm">
          {!this.state.showSwitchAccount ? (
            <form
              className="shadow-md bg-black rounded px-8 pt-6 pb-8 mb-4 gap-4 flex flex-col items-center justify-center"
              autocomplete="off"
              onSubmit={(e) => this.onLoginFormSubmit(e)}
            >
              <img className="w-20 h-20 mx-auto" src={logo} alt="iris" />
              <h1 className="text-2xl font-bold">iris</h1>
              <input
                className={`input centered-placeholder`}
                style={this.state.inputStyle}
                onInput={(e) => this.onNameChange(e)}
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
              {window.nostr ? (
                <p className="text-center text-blue-500 hover:text-blue-800">
                  <a href="" onClick={(e) => this.nostrExtensionLogin(e)}>
                    {t('nostr_extension_login')}
                  </a>
                </p>
              ) : null}
              <p className="text-center text-blue-500 hover:text-blue-800">
                <a
                  href=""
                  id="show-existing-account-login"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({ showSwitchAccount: true });
                  }}
                >
                  {t('private_key_login')}
                </a>
              </p>
              <LanguageSelector />
            </form>
          ) : (
            <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <p className="text-center text-blue-500 hover:text-blue-800">
                <a href="" id="show-create-account" onClick={(e) => this.showCreateAccount(e)}>
                  {t('back')}
                </a>
              </p>
              {this.renderExistingAccountLogin()}
            </div>
          )}
        </div>
      </section>
    );
  }
}

class ExistingAccountLogin extends Login {
  render() {
    return this.renderExistingAccountLogin();
  }
}

export { ExistingAccountLogin };
export default Login;
