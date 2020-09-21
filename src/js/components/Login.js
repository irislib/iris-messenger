import { html } from '../Helpers.js';
import { resetView, publicState } from '../Main.js';
import { translate as t } from '../Translation.js';
import LanguageSelector from './LanguageSelector.js';
import QRScanner from '../QRScanner.js';
import Session from '../Session.js';
import { Component } from '../lib/preact.js';

function onPastePrivKey(event) {
  const val = $(event.target).val();
  if (!val.length) { return; }
  try {
    var k = JSON.parse(val);
    Session.login(k);
    $(event.target).val('');
  } catch (e) {
    console.error('Login with key', val, 'failed:', e);
  }
}

function showSwitchAccount(e) {
  e.preventDefault();
  resetView();
  $('#create-account').hide();
  $('#existing-account-login').show();
  $('#paste-privkey').focus();
}

function onLoginFormSubmit(e) {
  e.preventDefault();
  var name = $('#login-form-name').val();
  if (name.length) {
    $('#login').hide();
    Gun.SEA.pair().then(k => {
      Session.login(k);
      publicState.user().get('profile').get('name').put(name);
      Session.createChatLink();
    });
  }
}

function showCreateAccount(e) {
  e.preventDefault();
  $('#privkey-qr-video').hide();
  $('#create-account').show();
  $('#existing-account-login').hide();
  QRScanner.cleanupScanner();
  $('#login-form-name').focus();
}

function showScanPrivKey() {
  if ($('#privkey-qr-video:visible').length) {
    $('#privkey-qr-video').hide();
    QRScanner.cleanupScanner();
  } else {
    $('#privkey-qr-video').show();
    QRScanner.startPrivKeyQRScanner().then(Session.login);
  }
}

class Login extends Component {
  componentDidMount() {
    $('#login-form-name').focus();
  }

  render() {
    return Session.getKey() ? '' : html`<section id="login">
      <div id="login-content">
        <form id="login-form" autocomplete="off" onSubmit=${e => onLoginFormSubmit(e)}>
          <div id="create-account">
            <img style="width: 86px" src="img/android-chrome-192x192.png" alt="Iris"/>
            <h1>Iris</h1>
            <input autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="off" id="login-form-name" type="text" name="name" placeholder="${t('whats_your_name')}"/>
            <p><button id="sign-up" type="submit">${t('new_user_go')}</button></p>
            <br/>
            <p><a href="#" id="show-existing-account-login" onClick=${e => showSwitchAccount(e)}>${t('already_have_an_account')}</a></p>
            <p>
              <svg width="14" height="14" style="margin-bottom: -1px" x="0px" y="0px" viewBox="0 0 469.333 469.333" style="enable-background:new 0 0 469.333 469.333;" xml:space="preserve"><path fill="currentColor" d="M253.227,300.267L253.227,300.267L199.04,246.72l0.64-0.64c37.12-41.387,63.573-88.96,79.147-139.307h62.507V64H192 V21.333h-42.667V64H0v42.453h238.293c-14.4,41.173-36.907,80.213-67.627,114.347c-19.84-22.08-36.267-46.08-49.28-71.467H78.72 c15.573,34.773,36.907,67.627,63.573,97.28l-108.48,107.2L64,384l106.667-106.667l66.347,66.347L253.227,300.267z"/><path fill="currentColor" d="M373.333,192h-42.667l-96,256h42.667l24-64h101.333l24,64h42.667L373.333,192z M317.333,341.333L352,248.853 l34.667,92.48H317.333z"/></svg>
              <${LanguageSelector}/>
            </p>
          </div>
        </form>
        <div id="existing-account-login" class="hidden">
          <p><a href="#" id="show-create-account" onClick=${e => showCreateAccount(e)}>> ${t('back')}</a></p>
          <input id="paste-privkey" onInput=${e => onPastePrivKey(e)} placeholder="${t('paste_private_key')}"/>
          <p>
            <button id="scan-privkey-btn" onClick=${e => showScanPrivKey(e)}>${t('scan_private_key_qr_code')}</button>
          </p>
          <p>
            <video id="privkey-qr-video" width="320" height="320" style="object-fit: cover;" class="hidden"></video>
          </p>
        </div>
      </div>
    </section>`;
  }
}

export default Login;
