/*import Helpers from '../../Helpers';
import { html } from 'htm/preact';
import State from '../../State';
import Session from '../../Session';
import LanguageSelector from '../../components/LanguageSelector';
import {translate as t} from '../../Translation';
import {setRTCConfig, getRTCConfig, DEFAULT_RTC_CONFIG} from '../../components/VideoCall';
import CopyButton from '../../components/CopyButton';
import Text from '../../components/Text';
import View from '../View';
import { route } from 'preact-router';
import {ExistingAccountLogin} from '../Login';
import Notifications from '../../Notifications';
import PeerSettings from './PeerSettings';
import $ from 'jquery';
import _ from 'lodash';
import QRCode from '../../lib/qrcode.min';

class Settings extends View {
  constructor() {
    super();
    this.state = Session.DEFAULT_SETTINGS;
    this.state.webPushSubscriptions = {};
    this.state.blockedUsers = {};
    this.id = "settings";
  }

  mailtoSubmit(e) {
    e.preventDefault();
    if (this.state.email && this.state.email === this.state.retypeEmail) {
      window.location.href = `mailto:${this.state.email}?&subject=Iris%20private%20key&body=${JSON.stringify(Session.getKey())}`;
    }
  }

  renderView() {
    const blockedUsers = _.filter(Object.keys(this.state.blockedUsers), user => this.state.blockedUsers[user]);
    return html`
      <div class="centered-container">
        <h3>${t('account')}</h3>
        <p>
          <b>${t('save_backup_of_privkey_first')}</b> ${t('otherwise_cant_log_in_again')}
        </p>
        <p>
          <button onClick=${() => route('/logout')}>${t('log_out')}</button>
        </p>
        <p>
          <button onClick=${() => this.setState({showSwitchAccount: !this.state.showSwitchAccount})}>${t('switch_account')}</button>
        </p>
        ${this.state.showSwitchAccount ? html`<${ExistingAccountLogin}/>` : ''}
        <h4>${t('private_key')}</h4>
        <p dangerouslySetInnerHTML=${{ __html: t('private_key_warning') }} ></p>
        <p>
          <button onClick=${() => downloadKey()}>${t('download_private_key')}</button>
          <${CopyButton} notShareable=${true} text=${t('copy_private_key')} copyStr=${JSON.stringify(Session.getKey())}/>
        </p>
        <p>
          <button onClick=${e => togglePrivateKeyQR(e)}>${t('show_privkey_qr')}</button>
        </p>
        <div id="private-key-qr" class="qr-container"></div>
        <p>
          ${t('email_privkey_to_yourself')}:
        </p>
        <p>
          <form onSubmit=${e => this.mailtoSubmit(e)}>
            <input name="email" type="email" onChange=${e => this.setState({email:e.target.value.trim()})} placeholder=${t('email')}/>
            <input name="verify_email" type="email" onChange=${e => this.setState({retypeEmail:e.target.value.trim()})} placeholder=${t('retype_email')}/>
            <button type="submit">${t('go')}</button>
          </form>
        </p>
        <p><small dangerouslySetInnerHTML=${{ __html: t('privkey_storage_recommendation')}}></small></p>
        <hr/>
        <h3>${t('language')}</h3>
        <p><${LanguageSelector} key="moi"/></p>
        <hr/>
        <h3>${t('notifications')}</h3>
        <p>${t('web_push_subscriptions')}</p>
        <div class="flex-table">
          ${Object.keys(this.state.webPushSubscriptions).map(k => {
            const v = this.state.webPushSubscriptions[k];
            if (!v) { return; }
            return html`
              <div class="flex-row">
                  <div class="flex-cell">${v.endpoint}</div>
                  <div class="flex-cell no-flex">
                      <button onClick=${() => Notifications.removeSubscription(k)}>${t('remove')}</button>
                  </div>
              </div>
            `;
          })}
        </div>
        <hr/>
        <${PeerSettings}/>
        <p>${t('also')} <a href="https://github.com/amark/gun#docker">Docker</a> ${t('or_small')} <a href="https://github.com/irislib/iris-electron">Iris-electron</a>.</p>
        ${Helpers.isElectron ? html`
          <hr/>
          <h3>Desktop</h3>
          <p><input type="checkbox" checked=${this.state.electron.openAtLogin} onChange=${() => State.electron.get('settings').get('openAtLogin').put(!this.state.electron.openAtLogin)} id="openAtLogin"/><label for="openAtLogin">Open at login</label></p>
          <p><input type="checkbox" checked=${this.state.electron.minimizeOnClose} onChange=${() => State.electron.get('settings').get('minimizeOnClose').put(!this.state.electron.minimizeOnClose)} id="minimizeOnClose"/><label for="minimizeOnClose">Minimize on close</label></p>
        `: ''}
        <hr/>
        <h3>${t('webtorrent')}</h3>
        <p><input type="checkbox" checked=${this.state.local.enableWebtorrent} onChange=${() => State.local.get('settings').get('enableWebtorrent').put(!this.state.local.enableWebtorrent)} id="enableWebtorrent"/><label for="enableWebtorrent">${t('automatically_load_webtorrent_attachments')}</label></p>
        <p><input type="checkbox" checked=${this.state.local.autoplayWebtorrent} onChange=${() => State.local.get('settings').get('autoplayWebtorrent').put(!this.state.local.autoplayWebtorrent)} id="autoplayWebtorrent"/><label for="autoplayWebtorrent">${t('autoplay_webtorrent_videos')}</label></p>
        <hr/>
        <h3>Show beta features</h3>
        <p><input type="checkbox" checked=${this.state.local.showBetaFeatures} onChange=${() => State.local.get('settings').get('showBetaFeatures').put(!this.state.local.showBetaFeatures)} id="showBetaFeatures"/><label for="showBetaFeatures">${t('show_beta_features')}</label></p>
        <h3>${t('webrtc_connection_options')}</h3>
        <p><small>${t('webrtc_info')}</small></p>
        <p><textarea rows="4" id="rtc-config" placeholder="${t('webrtc_connection_options')}" onChange=${e => this.rtcConfigChanged(e)}></textarea></p>
        <button onClick=${() => this.restoreDefaultRtcConfig()}>${t('restore_defaults')}</button>
        <hr/>
        <h3>${t('blocked_users')}</h3>
        ${blockedUsers.map(user => {
          if (this.state.blockedUsers[user]) {
            return html`<p><a href="/profile/${encodeURIComponent(user)}"><${Text} user=${user} path="profile/name" placeholder="User"/></a></p>`;
          }
        })}
        ${blockedUsers.length === 0 ? t('none') : ''}
      </div>
    `;
  }

  rtcConfigChanged(e) {
    setRTCConfig(JSON.parse(e.target.value));
  }

  restoreDefaultRtcConfig() {
    setRTCConfig(DEFAULT_RTC_CONFIG);
    $('#rtc-config').val(JSON.stringify(getRTCConfig()));
  }

  componentDidMount() {
    const blockedUsers = {};

    $('#rtc-config').val(JSON.stringify(getRTCConfig()));

    State.electron && State.electron.get('settings').on(this.inject('electron', 'electron'));
    State.local.get('settings').on(this.sub(local => {
      console.log('local settings', local);
      if (local) {
        this.setState({local});
      }
    }));
    State.public.user().get('webPushSubscriptions').map().on(this.sub(
      () => this.setState({webPushSubscriptions: Notifications.webPushSubscriptions})
    ));
    State.public.user().get('block').map().on(this.sub(
      (v,k) => {
        blockedUsers[k] = v;
        this.setState({blockedUsers});
      }
    ));
  }
}

function togglePrivateKeyQR(e) {
  let btn = $(e.target);
  let show = $('#private-key-qr img').length === 0;
  let SHOW_TEXT = t('show_privkey_qr');
  let hidePrivateKeyInterval;
  function reset() {
    clearInterval(hidePrivateKeyInterval);
    $('#private-key-qr').empty();
    btn.text(SHOW_TEXT);
  }
  function hideText(s) { return `${t('hide_privkey_qr')  } (${  s  })`; }
  if (show) {
    let showPrivateKeySecondsRemaining = 20;
    btn.text(hideText(showPrivateKeySecondsRemaining));
    hidePrivateKeyInterval = setInterval(() => {
      if ($('#private-key-qr img').length === 0) {
        clearInterval(hidePrivateKeyInterval);return;
      }
      showPrivateKeySecondsRemaining -= 1;
      if (showPrivateKeySecondsRemaining === 0) {
        reset();
      } else {
        btn.text(hideText(showPrivateKeySecondsRemaining));
      }
    }, 1000);
    let qrCodeEl = $('#private-key-qr');
    new QRCode(qrCodeEl[0], {
      text: JSON.stringify(Session.getKey()),
      width: 300,
      height: 300,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  } else {
    reset();
  }
}

function downloadKey() {
  const key = Session.getKey();
  delete key['#'];
  return Helpers.download('iris_private_key.txt', JSON.stringify(key), 'text/plain', 'utf-8');
}

export default Settings;*/
