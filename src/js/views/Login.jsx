import Helpers from '../Helpers';
import { translate as t } from '../translations/Translation';
import LanguageSelector from '../components/LanguageSelector';
import QRScanner from '../QRScanner';
import { Component } from 'preact';
import logo from '../../assets/img/android-chrome-192x192.png';
import Button from '../components/basic/Button';
import * as secp from '@noble/secp256k1';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Web3Modal from 'web3modal';
import Web3 from 'web3';
import iris from 'iris-lib';
import _ from 'lodash';
import { route } from 'preact-router';
import Nostr from "../Nostr";
const bech32 = require('bech32-buffer');

async function ethereumConnect() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: '4bd8d95876de48e0b17d56c0da31880a',
      },
    },
  };
  const web3Modal = new Web3Modal({
    network: 'mainnet',
    providerOptions,
    theme: 'dark',
  });

  web3Modal.on('accountsChanged', (provider) => {
    console.log('connect', provider);
  });

  const provider = await web3Modal.connect();
  return new Web3(provider);
}

function maybeGoToChat(key) {
  let chatId = iris.util.getUrlParameter('chatWith') || iris.util.getUrlParameter('channelId');
  let inviter = iris.util.getUrlParameter('inviter');
  function go() {
    if (inviter !== key.pub) {
      iris.session.newChannel(chatId, window.location.href);
    }
    _.defer(() => route(`/chat/${chatId}`)); // defer because router is only initialised after login // TODO fix
    window.history.pushState(
      {},
      'Iris Chat',
      `/${window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split('?')[0]}`,
    ); // remove param
  }
  if (chatId) {
    if (inviter) {
      setTimeout(go, 2000); // wait a sec to not re-create the same chat
    } else {
      go();
    }
  }
}

async function login(k) {
  iris.session.login(k);
  maybeGoToChat(k);
}

async function nostrLogin(name) {
  const rpub = await window.nostr.getPublicKey();
  const k = await iris.Key.generate();
  k.secp256k1 = { rpub };
  await login(k);
  setTimeout(async () => {
    iris
      .public()
      .get('profile')
      .get('name')
      .once((existingName) => {
        if (typeof existingName !== 'string' || existingName === '') {
          name = name || iris.util.generateName();
          iris.public().get('profile').put({ a: null });
          iris.public().get('profile').get('name').put(name);
        }
      });
  }, 2000);
}

async function ethereumLogin(name) {
  const web3 = await ethereumConnect();
  const accounts = await web3.eth.getAccounts();

  if (accounts.length > 0) {
    const message =
      "I'm trusting this application with an irrevocable access key to my Iris account.";
    const signature = await web3.eth.personal.sign(message, accounts[0]);
    const signatureBytes = hexToUint8Array(signature.substring(2));
    const k = iris.Key.deriveFromBytes(signatureBytes);
    await login(k);
    setTimeout(async () => {
      iris
        .public()
        .get('profile')
        .get('name')
        .once((existingName) => {
          if (typeof existingName !== 'string' || existingName === '') {
            name = name || iris.util.generateName();
            iris.public().get('profile').put({ a: null });
            iris.public().get('profile').get('name').put(name);
          }
        });
    }, 2000);
  }
}

class Login extends Component {
  componentDidMount() {
    const el = document.getElementById('login-form-name');
    el && el.focus();
    // re-render after 1 sec to make sure window.nostr is set
    setTimeout(() => this.setState({}), 100);
  }

  toggleScanPrivKey() {
    if (this.state.showScanPrivKey) {
      QRScanner.cleanupScanner();
    } else {
      QRScanner.startPrivKeyQRScanner().then(login);
    }
    this.setState({ showScanPrivKey: !this.state.showScanPrivKey });
  }

  async onPasteKey(event) {
    const val = event.target.value;
    if (!val.length) {
      return;
    }
    let k;
    try {
      k = JSON.parse(val);
    } catch (e) {}
    if (!k) {
      console.log(1);
      if (secp.utils.isValidPrivateKey(val)) {
        console.log(2);
        k = await iris.Key.fromSecp256k1(val);
      }
      try {
        const { data, prefix } = bech32.decode(val);
        const hex = Nostr.arrayToHex(data);
        if (prefix === 'npub') {
          k = await iris.Key.generate();
          k.secp256k1 = { rpub: hex };
        } else if (prefix === 'nsec') {
          k = await iris.Key.fromSecp256k1(hex);
        }
      } catch (e) {
        console.error(e);
      }
    }
    console.log('k', k);
    if (!k) {
      return;
    }
    console.log('login with', k);
    await login(k);
    event.target.value = '';
    Helpers.copyToClipboard(''); // clear the clipboard
  }

  showCreateAccount(e) {
    e.preventDefault();
    QRScanner.cleanupScanner();
    this.setState({ showSwitchAccount: false });
  }

  onLoginFormSubmit(e) {
    e.preventDefault();
    let name = document.getElementById('login-form-name').value || iris.util.generateName();
    iris.session.loginAsNewUser({ name, autofollow: false });
    // follow the developer's nostr key also
    this.base.style = 'display:none';
  }

  onNameChange(event) {
    const val = event.target.value;
    if ((val.indexOf('"priv"') !== -1) ||
        secp.utils.isValidPrivateKey(val) ||
        val.startsWith('nsec') ||
        val.startsWith('npub')) {
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
        />
        <p>
          <Button id="scan-privkey-btn" onClick={(e) => this.toggleScanPrivKey(e)}>
            {t('scan_private_key_qr_code')}
          </Button>
        </p>
        <p>
          <video
            id="privkey-qr-video"
            width="320"
            height="320"
            style="object-fit: cover;"
            className={this.state.showScanPrivKey ? '' : 'hidden'}
          />
        </p>
      </>
    );
  }

  render() {
    return (
      <section id="login">
        <div id="login-content">
          {!this.state.showSwitchAccount ? (
            <form id="login-form" autocomplete="off" onSubmit={(e) => this.onLoginFormSubmit(e)}>
              <div id="create-account">
                <img width="86" height="86" src={logo} alt="iris" />
                <h1>iris</h1>
                <input
                  style={this.state.inputStyle}
                  onInput={(e) => this.onNameChange(e)}
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="sentences"
                  spellcheck="off"
                  id="login-form-name"
                  type="text"
                  name="name"
                  placeholder={t('whats_your_name')}
                />
                <p>
                  <Button id="sign-up" type="submit">
                    {t('new_user_go')}
                  </Button>
                </p>
                <br />
                <p>
                  <a
                    href="#"
                    id="show-existing-account-login"
                    onClick={() => this.setState({ showSwitchAccount: true })}
                  >
                    {t('already_have_an_account')}
                  </a>
                </p>
                {window.nostr ? (
                  <p>
                    <a href="#" onClick={() => nostrLogin()}>
                      {t('nostr_login')}
                    </a>
                  </p>
                ) : null}
                <p>
                  <LanguageSelector />
                </p>
              </div>
            </form>
          ) : (
            <div id="existing-account-login">
              <p>
                <a href="#" id="show-create-account" onClick={(e) => this.showCreateAccount(e)}>
                  > {t('back')}
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
