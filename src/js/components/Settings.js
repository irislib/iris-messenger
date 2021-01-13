import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import State from '../State.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import LanguageSelector from './LanguageSelector.js';
import {translate as t} from '../Translation.js';
import PeerManager from '../PeerManager.js';
import {setRTCConfig, getRTCConfig, DEFAULT_RTC_CONFIG} from './VideoCall.js';
import CopyButton from './CopyButton.js';
import { route } from '../lib/preact-router.es.js';

class Settings extends Component {
  constructor() {
    super();
    this.eventListeners = [];
  }

  onProfilePhotoSet(src) {
    State.public.user().get('profile').get('photo').put(src);
  }

  render() {
    return html`
      <div class="main-view" id="settings">
        <div class="centered-container">
          <h3>${t('account')}</h3>
          <p>
            <b>${t('save_backup_of_privkey_first')}</b> ${t('otherwise_cant_log_in_again')}
          </p>
          <p>
            <button onClick=${() => route('/logout')}>${t('log_out')}</button>
          </p>
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
          <p><small dangerouslySetInnerHTML=${{ __html: t('privkey_storage_recommendation')}}></small></p>
          <hr/>
          <h3>${t('language')}</h3>
          <p><${LanguageSelector}/></p>
          <hr/>
          <h3>Notifications</h3>
          <p>Web push subscriptions</p>
          <div id="web-push-subscriptions" class="flex-table"></div>
          <hr/>
          <h3>${t('peers')}</h3>
          <div id="peers" class="flex-table">
            <div class="flex-row" id="add-peer-row">
              <div class="flex-cell">
                <input type="url" id="add-peer-url" placeholder="${t('peer_url')}"/>
                <input type="checkbox" id="add-peer-public"/>
                <label for="add-peer-public">${t('public')}</label>
                <button id="add-peer-btn">${t('add')}</button>
              </div>
            </div>
            <p>
              <small dangerouslySetInnerHTML=${{ __html:t('public_peer_info') }}></small>
            </p>
            <p>
              <small dangerouslySetInnerHTML=${{ __html: t('peers_info')}}></small>
            </p>
          </div>
          <hr/>
          <h3>${t('webrtc_connection_options')}</h3>
          <p><small>${t('webrtc_info')}</small></p>
          <p><textarea rows="4" id="rtc-config" placeholder="${t('webrtc_connection_options')}"></textarea></p>
          <button id="restore-default-rtc-config">${t('restore_defaults')}</button>
        </div>
      </div>`;
  }

  componentDidMount() {
    $('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

    $('#add-peer-btn').click(() => {
      var url = $('#add-peer-url').val();
      var visibility = $('#add-peer-public').is(':checked') ? 'public' : undefined;
      PeerManager.addPeer({url, visibility});
      $('#add-peer-url').val('');
      PeerManager.updatePeerList();
    });

    $('#rtc-config').val(JSON.stringify(getRTCConfig()));
    $('#rtc-config').change(() => {
      setRTCConfig(JSON.parse($('#rtc-config').val()));
    });
    $('#restore-default-rtc-config').click(() => {
      setRTCConfig(DEFAULT_RTC_CONFIG);
      $('#rtc-config').val(JSON.stringify(getRTCConfig()));
    });
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
  }
}

function togglePrivateKeyQR(e) {
  var btn = $(e.target);
  var show = $('#private-key-qr img').length === 0;
  var SHOW_TEXT = t('show_privkey_qr');
  let hidePrivateKeyInterval;
  function reset() {
    clearInterval(hidePrivateKeyInterval);
    $('#private-key-qr').empty();
    btn.text(SHOW_TEXT);
  }
  function hideText(s) { return t('hide_privkey_qr') + ' (' + s + ')'; }
  if (show) {
    var showPrivateKeySecondsRemaining = 20;
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
    var qrCodeEl = $('#private-key-qr');
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

export default Settings;
