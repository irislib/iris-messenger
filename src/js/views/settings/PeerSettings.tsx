import Component from "../../BaseComponent";
import Name from "../../components/Name";
import Session from "../../../../iris-lib/src/Session";
import State from "iris-lib/src/State";
import {translate as t} from "../../translations/Translation";
import Helpers from "../../Helpers";
import Icons from "../../Icons";
import iris from "iris-lib";
const {PeerManager} = iris;
import {route} from "preact-router";
import $ from "jquery";
import Button from "../../components/basic/Button";

export default class PeerSettings extends Component {
  state = Session.DEFAULT_SETTINGS;
  updatePeersFromGunInterval = 0;

  componentDidMount() {
    State.local.get('settings').on(this.sub(local => {
        console.log('settings', local);
        if (local) {
          this.setState(local);
        }
    }));
    this.updatePeersFromGun();
    this.updatePeersFromGunInterval = window.setInterval(() => this.updatePeersFromGun(), 1000);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.clearInterval(this.updatePeersFromGunInterval);
  }

  render() {
    return (
        <>
        <div class="centered-container">
            <h3>{t('peers')}</h3>
            {this.renderPeerList()}
            <p><input type="checkbox" checked={this.state.local.enablePublicPeerDiscovery}
                      onChange={() => State.local.get('settings').get('enablePublicPeerDiscovery').put(!this.state.local.enablePublicPeerDiscovery)}
                      id="enablePublicPeerDiscovery" />
                <label htmlFor="enablePublicPeerDiscovery">{t('enable_public_peer_discovery')}</label></p>
            <h4>{t('maximum_number_of_peer_connections')}</h4>
            <p>
                <input type="number" value={this.state.local.maxConnectedPeers} onChange={e => {
                    const target = e.target as HTMLInputElement;
                    State.local.get('settings').get('maxConnectedPeers').put(target.value || 0);
                }}/>
            </p>
            {Helpers.isElectron ? (
                <>
                    <h4>{t('your_public_address')}</h4>
                    <p>http://{this.state.electron.publicIp || '-'}:8767/gun</p>
                    <p><small>If you're behind NAT (likely) and want to accept incoming connections, you need to configure your router to forward the port 8767 to this computer.</small></p>
                </>
            ) : ''}
            <h4>{t('set_up_your_own_peer')}</h4>
            <p>
                <small
                    dangerouslySetInnerHTML={{__html: t('peers_info', "href=\"https://github.com/amark/gun#deploy\"")}}></small>
            </p>
            <p><a href="https://heroku.com/deploy?template=https://github.com/mmalmi/rod">
                {Icons.herokuButton}
            </a></p>
            <p>{t('also')} <a href="https://github.com/amark/gun#docker">Docker</a> {t('or_small')} <a href="https://github.com/irislib/iris-electron">Iris-electron</a>.</p>
            </div>
        </>
    );
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

    return (
      <div id="peers" class="flex-table">
        {urls.length === 0 ?
          <Button id="reset-peers" style="margin-bottom: 15px" onClick={() => this.resetPeersClicked()}>{t('restore_defaults')}</Button>
        : ''}
        {urls.map(url => {
            const peer = PeerManager.getKnownPeers()[url] || {};
            const peerFromGun = this.state.peersFromGun && this.state.peersFromGun[url];
            const connected = peerFromGun && peerFromGun.wire && peerFromGun.wire.readyState == 1 && peerFromGun.wire.bufferedAmount === 0;
            return (
              <div class="flex-row peer">
                <div class="flex-cell">
                  {connected ? (
                    <span class="tooltip" style="color: var(--positive-color);margin-right:15px">
                      <span class="tooltiptext">Connected</span>
                      <svg height="14" width="14" x="0px" y="0px" viewBox="0 0 191.667 191.667"><path fill="currentColor" d="M95.833,0C42.991,0,0,42.99,0,95.833s42.991,95.834,95.833,95.834s95.833-42.991,95.833-95.834S148.676,0,95.833,0z M150.862,79.646l-60.207,60.207c-2.56,2.56-5.963,3.969-9.583,3.969c-3.62,0-7.023-1.409-9.583-3.969l-30.685-30.685 c-2.56-2.56-3.97-5.963-3.97-9.583c0-3.621,1.41-7.024,3.97-9.584c2.559-2.56,5.962-3.97,9.583-3.97c3.62,0,7.024,1.41,9.583,3.971 l21.101,21.1l50.623-50.623c2.56-2.56,5.963-3.969,9.583-3.969c3.62,0,7.023,1.409,9.583,3.969 C156.146,65.765,156.146,74.362,150.862,79.646z"/></svg>
                    </span>
                  ) : (
                    <small class="tooltip" style="margin-right:15px">
                      <span class="tooltiptext">Disconnected</span>
                      <svg width="14" height="14" x="0px" y="0px" viewBox="0 0 512 512" fill="currentColor"><path d="M257,0C116.39,0,0,114.39,0,255s116.39,257,257,257s255-116.39,255-257S397.61,0,257,0z M383.22,338.79 c11.7,11.7,11.7,30.73,0,42.44c-11.61,11.6-30.64,11.79-42.44,0L257,297.42l-85.79,83.82c-11.7,11.7-30.73,11.7-42.44,0 c-11.7-11.7-11.7-30.73,0-42.44l83.8-83.8l-83.8-83.8c-11.7-11.71-11.7-30.74,0-42.44c11.71-11.7,30.74-11.7,42.44,0L257,212.58 l83.78-83.82c11.68-11.68,30.71-11.72,42.44,0c11.7,11.7,11.7,30.73,0,42.44l-83.8,83.8L383.22,338.79z"/></svg>
                    </small>
                  )}
                  {url}
                  {peer.from ? (
                    <>
                        <br />
                        <small style="cursor:pointer" onClick={() => route(`/profile/{peer.from}`)}>
                            {t('from')} <Name pub={peer.from} placeholder={peer.from.slice(0,6)} />
                        </small>
                    </>
                  ) : ''}
                </div>
                <div class="flex-cell no-flex">
                  <Button onClick={() => this.removePeerClicked(url, peerFromGun)}>{t('remove')}</Button>
                  <Button onClick={() => this.enablePeerClicked(url, peerFromGun, peer)}>{peer.enabled ? t('disable') : t('enable')}</Button>
                </div>
              </div>
            );
          })
        }

        <div class="flex-row" id="add-peer-row">
          <div class="flex-cell">
            <input type="url" id="add-peer-url" placeholder={t('peer_url')} />
            <input type="checkbox" id="add-peer-public" />
            <label for="add-peer-public">{t('public')}</label>
            <Button id="add-peer-btn" onClick={() => this.addPeerClicked()}>{t('add')}</Button>
          </div>
        </div>
        <p>
          <small dangerouslySetInnerHTML={{ __html:t('public_peer_info') }}></small>
        </p>
      </div>
    );
  }

  shouldComponentUpdate() {
    return true;
  }

  updatePeersFromGun() {
    const peersFromGun = State.public.back('opt.peers') || {};
    // @ts-ignore
      this.setState({peersFromGun});
  }

  addPeerClicked() {
    let url = $('#add-peer-url').val();
    let visibility = $('#add-peer-public').is(':checked') ? 'public' : undefined;
    PeerManager.addPeer({url, visibility});
    $('#add-peer-url').val('');
  }
}