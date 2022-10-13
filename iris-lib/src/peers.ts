import session from './session';
import _ from './lodash';
import Gun from 'gun';
import util from './util';
import publicState from './global';

const ELECTRON_GUN_URL = 'http://localhost:8767/gun';
let maxConnectedPeers = 1;

type Peer = {
  url?: string;
  enabled?: boolean;
  from?: string;
  visibility?: string;
}

type Peers = {
  [key: string]: Peer
}

const DEFAULT_PEERS: Peers = {
  'https://gun-rs.iris.to/gun': {},
  'https://gun-us.herokuapp.com/gun': {},
};

const loc = window.location;
const host = loc.host;
const is_localhost_but_not_dev = host.startsWith('localhost') && host !== 'localhost:8080';
if (loc.hostname.endsWith('herokuapp.com') || is_localhost_but_not_dev) {
  Object.keys(DEFAULT_PEERS).forEach(url => DEFAULT_PEERS[url].enabled = false);
  DEFAULT_PEERS[`${loc.origin}/gun`] = {enabled: true};
}

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

/**
 * Networking and peer management utilities
 */
export default {
  known: {} as Peers,

  /** */
  async add(peer: Peer) {
    if (peer.url && !urlRegex.test(peer.url)) {
      throw new Error(`Invalid url ${peer.url}`);
    }

    if (peer.from) {
      Object.keys(this.known).forEach(k => {
        if (this.known[k].from === peer.from) { // remove previous peer url from the same user
          delete this.known[k];
        }
      });
    }
    const url = peer.url || '';
    this.known[url] = this.known[url] || _.omit(peer, ['url']);
    if (peer.visibility === 'public') {
      // rolling some crypto operations to obfuscate actual url in case we want to remove it
      let secret = await Gun.SEA.secret(session.getKey().epub, session.getKey()) || '';
      let encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
      let encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
      publicState().user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
    }
    if (peer.enabled !== false) {
      peer.url && this.connect(peer.url); // this calls savePeers()
    } else {
      this.save();
    }
  },

  /** */
  remove(url: string) {
    delete this.known[url];
    this.save();
  },

  /** */
  disconnect(peerFromGun: any) {
    publicState().on('bye', peerFromGun);
    peerFromGun.url = '';
  },

  save() {
    localStorage.setItem('gunPeers', JSON.stringify(this.known));
  },

  getSaved() {
    let p: any = localStorage.getItem('gunPeers');
    if (p && p !== 'undefined') {
      p = JSON.parse(p);
    } else {
      p = DEFAULT_PEERS;
    }
    if (util.isElectron) {
      p[ELECTRON_GUN_URL] = {};
    }
    Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
    return p;
  },

  /** */
  reset() {
    localStorage.setItem('gunPeers', '');
    this.known = this.getSaved();
  },

  /** */
  connect(url: string) {
    if (this.isMixedContent(url)) { return; }
    if (this.known[url]) {
      this.known[url].enabled = true;
      publicState().opt({peers: [url]});
      this.save();
    } else {
      this.add({url});
    }
  },

  /** */
  disable(url: string, peerFromGun: any) {
    this.known[url].enabled = false;
    if (peerFromGun) {
      this.disconnect(peerFromGun);
    }
    this.save();
  },

  isMixedContent(url: string) {
    return window.location.protocol === 'https:' && (url.indexOf('http:') === 0);
  },

  random() {
    const connectToLocalElectron = util.isElectron && this.known[ELECTRON_GUN_URL] && this.known[ELECTRON_GUN_URL].enabled !== false;
    const sampleSize = connectToLocalElectron ? Math.max(maxConnectedPeers - 1, 1) : maxConnectedPeers;
    const sample = _.sampleSize(
      Object.keys(
        _.pickBy(this.known, (peer: any, url: string) => {
          return !this.isMixedContent(url) && peer.enabled && !(util.isElectron && url === ELECTRON_GUN_URL);
        })
      ), sampleSize
    );
    if (sample && connectToLocalElectron) {
      sample.push(ELECTRON_GUN_URL);
    }
    return sample;
  },

  checkGunPeerCount() {
    let peersFromGun = publicState().back('opt.peers');
    let connectedPeers = Object.values(peersFromGun).filter((peer: any) => {
      if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
        console.log('WebRTC peer', peer);
      }
      return peer && peer.wire && peer.wire.readyState === 1  && peer.wire.bufferedAmount === 0 && peer.wire.constructor.name === 'WebSocket';
    });
    if (connectedPeers.length < maxConnectedPeers) {
      let unconnectedPeers = Object.keys(this.known).filter(url => {
        let addedToGun = Object.values(peersFromGun).map((peer:any) => peer.url).indexOf(url) > -1;
        let enabled = this.known[url].enabled;
        const mixedContent = (window.location.protocol === 'https:' && (url.indexOf('http:') === 0));
        return !mixedContent && enabled && !addedToGun;
      });
      if (unconnectedPeers.length) {
        const sample = String(_.sample(unconnectedPeers));
        this.connect(sample);
      }
    }
    if (connectedPeers.length > maxConnectedPeers) {
      this.disconnect(_.sample(connectedPeers));
    }
  },

  init() {
    this.known = this.getSaved();
    /* use the default value of 1 for now because of memory issue
    local().get('settings').get('maxConnectedPeers').on(n => {
      if (n !== undefined) maxConnectedPeers = n;
    });
     */
    setInterval(() => this.checkGunPeerCount(), 1000);
  }
};
