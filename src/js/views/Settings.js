import { html } from '../Helpers.js';
import State from '../State.js';
import Session from '../Session.js';
import Helpers from '../Helpers.js';
import LanguageSelector from '../components/LanguageSelector.js';
import {translate as t} from '../Translation.js';
import PeerManager from '../PeerManager.js';
import {setRTCConfig, getRTCConfig, DEFAULT_RTC_CONFIG} from '../components/VideoCall.js';
import CopyButton from '../components/CopyButton.js';
import View from './View.js';
import { route } from '../lib/preact-router.es.js';
import {ExistingAccountLogin} from './Login.js';

class Settings extends View {
  constructor() {
    super();
    this.eventListeners = [];
    this.state = Session.DEFAULT_SETTINGS;
    this.id = "settings";
  }

  onProfilePhotoSet(src) {
    State.public.user().get('profile').get('photo').put(src);
  }

  renderView() {
    return html`
      <div class="centered-container">
        <h3>${t('account')}</h3>
        <p>
          <b>${t('save_backup_of_privkey_first')}</b> ${t('otherwise_cant_log_in_again')}
        </p>
        <p>
          <button onClick=${() => route('/logout')}>${t('log_out')}</button>
        </p>
        ${this.props.showSwitchAccount ? html`
          <p>
            <button onClick=${() => this.setState({showSwitchAccount: !this.state.showSwitchAccount})}>${t('switch_account')}</button>
          </p>
          ${this.state.showSwitchAccount ? ExistingAccountLogin : ''}
        `: ''}
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
        ${this.renderPeerList()}
        <p><input type="checkbox" checked=${this.state.local.enablePublicPeerDiscovery} onChange=${() => State.local.get('settings').get('enablePublicPeerDiscovery').put(!this.state.local.enablePublicPeerDiscovery)} id="enablePublicPeerDiscovery"/><label for="enablePublicPeerDiscovery">Enable public peer discovery</label></p>
        <h4>${t('maximum_number_of_peer_connections')}</h4>
        <p>
          <small>There's a bug that may cause high CPU and bandwidth usage when connecting to more than 1 peer. Working on it!</small>
        </p>
        <p>
          <input type="number" value=${this.state.local.maxConnectedPeers} onChange=${e => State.local.get('settings').get('maxConnectedPeers').put(e.target.value || 0)}/>
        </p>
        ${iris.util.isElectron ? html`
          <h4>${t('your_public_address')}</h4>
          <p>http://${this.state.electron.publicIp || '-'}:8767/gun</p>
          <p><small>If you're behind NAT (likely) and want to accept incoming connections, you need to configure your router to forward the port 8767 to this computer.</small></p>
        `: ''}
        <h4>Set up your own peer</h4>
        <p>
          <small dangerouslySetInnerHTML=${{ __html: t('peers_info')}}></small>
        </p>
        <p><a href="https://heroku.com/deploy?template=https://github.com/amark/gun">
           <img src="./img/herokubutton.svg" alt="Deploy"/>
        </a></p>
        <p>Or <a href="https://github.com/amark/gun#docker">Docker</a>, or <a href="https://github.com/irislib/iris-electron">Iris-electron</a>.</p>
        ${iris.util.isElectron ? html`
          <hr/>
          <h3>Desktop</h3>
          <p><input type="checkbox" checked=${this.state.electron.openAtLogin} onChange=${() => State.electron.get('settings').get('openAtLogin').put(!this.state.electron.openAtLogin)} id="openAtLogin"/><label for="openAtLogin">Open at login</label></p>
          <p><input type="checkbox" checked=${this.state.electron.minimizeOnClose} onChange=${() => State.electron.get('settings').get('minimizeOnClose').put(!this.state.electron.minimizeOnClose)} id="minimizeOnClose"/><label for="minimizeOnClose">Minimize on close</label></p>
        `: ''}
        <hr/>
        <h3>${t('webtorrent')}</h3>
        <p><input type="checkbox" checked=${this.state.local.enableWebtorrent} onChange=${() => State.local.get('settings').get('enableWebtorrent').put(!this.state.local.enableWebtorrent)} id="enableWebtorrent"/><label for="enableWebtorrent">Enable webtorrent videos</label></p>
        <p><input type="checkbox" checked=${this.state.local.autoplayWebtorrent} onChange=${() => State.local.get('settings').get('autoplayWebtorrent').put(!this.state.local.autoplayWebtorrent)} id="autoplayWebtorrent"/><label for="autoplayWebtorrent">Autoplay webtorrent videos</label></p>
        <hr/>
        <h3>${t('webrtc_connection_options')}</h3>
        <p><small>${t('webrtc_info')}</small></p>
        <p><textarea rows="4" id="rtc-config" placeholder="${t('webrtc_connection_options')}"></textarea></p>
        <button id="restore-default-rtc-config">${t('restore_defaults')}</button>
      </div>
    `;
  }

  resetPeersClicked() {
    PeerManager.resetPeers();
    this.setState({});
  }

  removePeerClicked(url, peerFromGun) {
    PeerManager.removePeer(url);
    peerFromGun && PeerManager.disconnectPeer(peerFromGun);
  }

  enablePeerClicked(url, peerFromGun, peer) {
    peer.enabled ? PeerManager.disablePeer(url,peerFromGun) : PeerManager.connectPeer(url);
  }

  renderPeerList() {
    let urls = Object.keys(PeerManager.getKnownPeers());
    if (this.state.peersFromGun) {
      Object.keys(this.state.peersFromGun).forEach(url => urls.indexOf(url) === -1 && urls.push(url));
    }

    return html`
      <div id="peers" class="flex-table">
        ${urls.length === 0 ? html`
          <button id="reset-peers" style="margin-bottom: 15px" onClick=${() => this.resetPeersClicked()}>${t('restore_defaults')}</button>
        `: ''}
        ${urls.map(url => {
            const peer = PeerManager.getKnownPeers()[url];
            const peerFromGun = this.state.peersFromGun && this.state.peersFromGun[url];
            const connected = peerFromGun && peerFromGun.wire && peerFromGun.wire.hied === 'hi';
            return html`
              <div class="flex-row peer">
                <div class="flex-cell">
                  ${connected ? html`
                    <span style="color: var(--positive-color);margin-right:15px"><svg height="14" width="14" x="0px" y="0px" viewBox="0 0 191.667 191.667"><path fill="currentColor" d="M95.833,0C42.991,0,0,42.99,0,95.833s42.991,95.834,95.833,95.834s95.833-42.991,95.833-95.834S148.676,0,95.833,0z M150.862,79.646l-60.207,60.207c-2.56,2.56-5.963,3.969-9.583,3.969c-3.62,0-7.023-1.409-9.583-3.969l-30.685-30.685 c-2.56-2.56-3.97-5.963-3.97-9.583c0-3.621,1.41-7.024,3.97-9.584c2.559-2.56,5.962-3.97,9.583-3.97c3.62,0,7.024,1.41,9.583,3.971 l21.101,21.1l50.623-50.623c2.56-2.56,5.963-3.969,9.583-3.969c3.62,0,7.023,1.409,9.583,3.969 C156.146,65.765,156.146,74.362,150.862,79.646z"/></svg></span>
                  ` : html`
                    <small style="margin-right:15px"><svg width="14" height="14" x="0px" y="0px" viewBox="0 0 512 512" fill="currentColor"><path d="M257,0C116.39,0,0,114.39,0,255s116.39,257,257,257s255-116.39,255-257S397.61,0,257,0z M383.22,338.79 c11.7,11.7,11.7,30.73,0,42.44c-11.61,11.6-30.64,11.79-42.44,0L257,297.42l-85.79,83.82c-11.7,11.7-30.73,11.7-42.44,0 c-11.7-11.7-11.7-30.73,0-42.44l83.8-83.8l-83.8-83.8c-11.7-11.71-11.7-30.74,0-42.44c11.71-11.7,30.74-11.7,42.44,0L257,212.58 l83.78-83.82c11.68-11.68,30.71-11.72,42.44,0c11.7,11.7,11.7,30.73,0,42.44l-83.8,83.8L383.22,338.79z"/></svg></small>
                  `}
                  ${url}
                  ${peer.from ? html`
                    <br/><small style="cursor:pointer" onClick=${() => route('/profile/' + peer.from)}>${t('from')} ${Helpers.truncateString(peer.from, 10)}</small>
                  ` : ''}
                </div>
                <div class="flex-cell no-flex">
                  <button onClick=${() => this.removePeerClicked(url, peerFromGun)}>${t('remove')}</button>
                  <button onClick=${() => this.enablePeerClicked(url, peerFromGun, peer)}>${peer.enabled ? t('disable') : t('enable')}</button>
                </div>
              </div>
            `;
          })
        }

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
      </div>
    `;
  }

  updatePeersFromGun() {
    const peersFromGun = State.public.back('opt.peers') || {};
    this.setState({peersFromGun});
  }

  componentDidMount() {
    this.updatePeersFromGun();
    this.updatePeersFromGunInterval = setInterval(() => this.updatePeersFromGun(), 2000);
    $('#desktop-application-about').toggle(!iris.util.isMobile && !iris.util.isElectron);

    $('#add-peer-btn').click(() => {
      var url = $('#add-peer-url').val();
      var visibility = $('#add-peer-public').is(':checked') ? 'public' : undefined;
      PeerManager.addPeer({url, visibility});
      $('#add-peer-url').val('');
    });

    $('#rtc-config').val(JSON.stringify(getRTCConfig()));
    $('#rtc-config').change(() => {
      setRTCConfig(JSON.parse($('#rtc-config').val()));
    });
    $('#restore-default-rtc-config').click(() => {
      setRTCConfig(DEFAULT_RTC_CONFIG);
      $('#rtc-config').val(JSON.stringify(getRTCConfig()));
    });

    State.electron && State.electron.get('settings').on(electron => {
      this.setState({electron});
    });
    State.local.get('settings').on(local => {
      this.setState({local})
    });
  }

  componentWillUnmount() {
    this.eventListeners.forEach(e => e.off());
    clearInterval(this.updatePeersFromGunInterval);
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
