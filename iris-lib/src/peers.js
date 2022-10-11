import Session from './session';
import _ from 'lodash';
import Gun from 'gun';
import util from './util';
import publicState from './public';
import local from './local';

const MAX_PEER_LIST_SIZE = 10;
const ELECTRON_GUN_URL = 'http://localhost:8767/gun';
let maxConnectedPeers = 1;
const DEFAULT_PEERS = {};

DEFAULT_PEERS['https://gun-rs.iris.to/gun'] = {};
DEFAULT_PEERS['https://gun-us.herokuapp.com/gun'] = {};
const loc = window.location;
const host = loc.host;
const is_localhost_but_not_dev = host.startsWith('localhost') && host !== 'localhost:8080';
if (loc.hostname.endsWith('herokuapp.com') || is_localhost_but_not_dev) {
  Object.keys(DEFAULT_PEERS).forEach(url => DEFAULT_PEERS[url].enabled = false);
  DEFAULT_PEERS[`${loc.origin}/gun`] = {enabled: true};
}

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

/**
 * Peer management utilities
 */
export default {
  known: {},

  /** */
  async add(peer) {
    if (!urlRegex.test(peer.url)) {
      throw new Error('Invalid url', peer.url);
    }

    if (peer.from) {
      Object.keys(this.known).forEach(k => {
        if (this.known[k].from === peer.from) { // remove previous peer url from the same user
          delete this.known[k];
        }
      });
    }
    this.known[peer.url] = this.known[peer.url] || _.omit(peer, 'url');
    if (peer.visibility === 'public') {
      // rolling some crypto operations to obfuscate actual url in case we want to remove it
      let secret = await Gun.SEA.secret(Session.getKey().epub, Session.getKey());
      let encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
      let encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
      publicState().user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
    }
    if (peer.enabled !== false) {
      this.connect(peer.url); // this calls savePeers()
    } else {
      this.save();
    }
  },

  /** */
  remove(url) {
    delete this.known[url];
    this.save();
  },

  /** */
  disconnect(peerFromGun) {
    publicState().on('bye', peerFromGun);
    peerFromGun.url = '';
  },

  save() {
    localStorage.setItem('gunPeers', JSON.stringify(this.known));
  },

  getSaved() {
    let p = localStorage.getItem('gunPeers');
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
    localStorage.setItem('gunPeers', undefined);
    this.known = this.getSaved();
  },

  /** */
  connect(url) {
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
  disable(url, peerFromGun) {
    this.known[url].enabled = false;
    if (peerFromGun) {
      this.disconnect(peerFromGun);
    }
    this.save();
  },

  isMixedContent(url) {
    return window.location.protocol === 'https:' && (url.indexOf('http:') === 0);
  },

  random() {
    const connectToLocalElectron = util.isElectron && this.known[ELECTRON_GUN_URL] && this.known[ELECTRON_GUN_URL].enabled !== false;
    const sampleSize = connectToLocalElectron ? Math.max(maxConnectedPeers - 1, 1) : maxConnectedPeers;
    const sample = _.sampleSize(
      Object.keys(
        _.pickBy(this.known, (peer, url) => {
          return !this.isMixedContent(url) && peer.enabled && !(util.isElectron && url === ELECTRON_GUN_URL);
        })
      ), sampleSize
    );
    if (sample && connectToLocalElectron) {
      sample.push(ELECTRON_GUN_URL);
    }
    return sample;
  },

  askForPeers: _.once(async pub => {
    const enablePublicPeerDiscovery = await local().get('settings').get('local').get('enablePublicPeerDiscovery').once();
    if (!enablePublicPeerDiscovery) { return; }
    _.defer(() => {
      publicState().user(pub).get('peers').once().map().on(peer => {
        if (peer && peer.url) {
          let peerCountBySource = _.countBy(this.known, p => p.from);
          let peerSourceCount = Object.keys(peerCountBySource).length;
          if (!peerCountBySource[pub]) {
            peerSourceCount += 1;
          }
          let maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
          this.add({url: peer.url, connect: true, from: pub});
          while (Object.keys(this.known).length > MAX_PEER_LIST_SIZE) {
            _.each(Object.keys(peerCountBySource), source => {
              if (peerCountBySource[source] > maxPeersFromSource) {
                delete this.known[_.sample(Object.keys(this.known))];
                peerCountBySource[source] -= 1;
              }
            });
          }
        }
      });
    });
  }),

  checkGunPeerCount() {
    let peersFromGun = publicState().back('opt.peers');
    let connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
      if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
        console.log('WebRTC peer', peer);
      }
      return peer && peer.wire && peer.wire.readyState === 1  && peer.wire.bufferedAmount === 0 && peer.wire.constructor.name === 'WebSocket';
    });
    if (connectedPeers.length < maxConnectedPeers) {
      let unconnectedPeers = _.filter(Object.keys(this.known), url => {
        let addedToGun = _.map(Object.values(peersFromGun), 'url').indexOf(url) > -1;
        let enabled = this.known[url].enabled;
        const mixedContent = (window.location.protocol === 'https:' && (url.indexOf('http:') === 0));
        return !mixedContent && enabled && !addedToGun;
      });
      if (unconnectedPeers.length) {
        this.connect(_.sample(unconnectedPeers));
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
