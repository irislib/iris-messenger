import State from './State';
import Helpers from './Helpers';
import Session from './Session';
import _ from 'lodash';
import Gun from 'gun';

const MAX_PEER_LIST_SIZE = 10;
const ELECTRON_GUN_URL = 'http://localhost:8767/gun';
let maxConnectedPeers = Helpers.isElectron ? 2 : 1;
const DEFAULT_PEERS = {};

DEFAULT_PEERS['https://gun-rs.iris.to/gun'] = {};
// DEFAULT_PEERS['https://gun-us.herokuapp.com/gun'] = {}; // disable for now
const loc = window.location;
const host = loc.host;
const is_localhost_but_not_dev = host.startsWith('localhost') && host !== 'localhost:8080';
if (loc.hostname.endsWith('herokuapp.com') || is_localhost_but_not_dev) {
  Object.keys(DEFAULT_PEERS).forEach(url => DEFAULT_PEERS[url].enabled = false);
  DEFAULT_PEERS[`${loc.origin}/gun`] = {enabled: true};
}

let knownPeers = getSavedPeers();

async function addPeer(peer) {
  if (!Helpers.isUrl(peer.url)) {
    throw new Error('Invalid url', peer.url);
  }
  if (peer.from) {
    Object.keys(knownPeers).forEach(k => {
      if (knownPeers[k].from === peer.from) { // remove previous peer url from the same user
        delete knownPeers[k];
      }
    });
  }
  knownPeers[peer.url] = knownPeers[peer.url] || _.omit(peer, 'url');
  if (peer.visibility === 'public') {
    // rolling some crypto operations to obfuscate actual url in case we want to remove it
    let secret = await Gun.SEA.secret(Session.getKey().epub, Session.getKey());
    let encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
    let encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
    State.public.user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
  }
  if (peer.enabled !== false) {
    connectPeer(peer.url); // this calls savePeers()
  } else {
    savePeers();
  }
}

function removePeer(url) {
  delete knownPeers[url];
  savePeers();
}

function disconnectPeer(peerFromGun) {
  State.public.on('bye', peerFromGun);
  peerFromGun.url = '';
}

function getKnownPeers() {
  return knownPeers;
}

function getSavedPeers() {
  let p = localStorage.getItem('gunPeers');
  if (p && p !== 'undefined') {
    p = JSON.parse(p);
  } else {
    p = DEFAULT_PEERS;
  }
  if (Helpers.isElectron) {
    p[ELECTRON_GUN_URL] = {};
  }
  Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
  return p;
}

function resetPeers() {
  localStorage.setItem('gunPeers', undefined);
  knownPeers = getSavedPeers();
}

function savePeers() {
  localStorage.setItem('gunPeers', JSON.stringify(knownPeers));
}

function connectPeer(url) {
  if (isMixedContent(url)) { return; }
  if (knownPeers[url]) {
    knownPeers[url].enabled = true;
    State.public.opt({peers: [url]});
    savePeers();
  } else {
    addPeer({url});
  }
}

function disablePeer(url, peerFromGun) {
  knownPeers[url].enabled = false;
  if (peerFromGun) {
    disconnectPeer(peerFromGun);
  }
  savePeers();
}

function isMixedContent(url) {
  return window.location.protocol === 'https:' && (url.indexOf('http:') === 0);
}

function getRandomPeers() {
  const connectToLocalElectron = Helpers.isElectron && knownPeers[ELECTRON_GUN_URL] && knownPeers[ELECTRON_GUN_URL].enabled !== false;
  const sampleSize = connectToLocalElectron ? Math.max(maxConnectedPeers - 1, 1) : maxConnectedPeers;
  const sample = _.sampleSize(
    Object.keys(
      _.pickBy(knownPeers, (peer, url) => {
        return !isMixedContent(url) && peer.enabled && !(Helpers.isElectron && url === ELECTRON_GUN_URL);
      })
    ), sampleSize
  );
  if (sample && connectToLocalElectron) {
    sample.push(ELECTRON_GUN_URL);
  }
  return sample;
}

let askForPeers = _.once(pub => {
  if (!Session.settings.local.enablePublicPeerDiscovery) { return; }
  _.defer(() => {
    State.public.user(pub).get('peers').once().map().on(peer => {
      if (peer && peer.url) {
        let peerCountBySource = _.countBy(knownPeers, p => p.from);
        let peerSourceCount = Object.keys(peerCountBySource).length;
        if (!peerCountBySource[pub]) {
          peerSourceCount += 1;
        }
        let maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
        addPeer({url: peer.url, connect: true, from: pub});
        while (Object.keys(knownPeers).length > MAX_PEER_LIST_SIZE) {
          _.each(Object.keys(peerCountBySource), source => {
            if (peerCountBySource[source] > maxPeersFromSource) {
              delete knownPeers[_.sample(Object.keys(knownPeers))];
              peerCountBySource[source] -= 1;
            }
          });
        }
      }
    });
  });
});

function checkGunPeerCount() {
  let peersFromGun = State.public.back('opt.peers');
  console.log('peersFromGun', peersFromGun);
  let connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
    if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
      console.log('WebRTC peer', peer);
    }
    return peer && peer.wire && peer.wire.readyState === 1  && peer.wire.bufferedAmount === 0 && peer.wire.constructor.name === 'WebSocket';
  });
  if (connectedPeers.length < maxConnectedPeers) {
    let unconnectedPeers = _.filter(Object.keys(knownPeers), url => {
      let addedToGun = _.map(Object.values(peersFromGun), 'url').indexOf(url) > -1;
      let enabled = knownPeers[url].enabled;
      const mixedContent = (window.location.protocol === 'https:' && (url.indexOf('http:') === 0));
      return !mixedContent && enabled && !addedToGun;
    });
    if (unconnectedPeers.length) {
      connectPeer(_.sample(unconnectedPeers));
    }
  }
  if (connectedPeers.length > maxConnectedPeers) {
    disconnectPeer(_.sample(connectedPeers));
  }
}

function init() {
  State.local.get('settings').get('maxConnectedPeers').on(n => {
    if (n !== undefined) maxConnectedPeers = n;
  });
  setInterval(checkGunPeerCount, 10000);
}

export default {
  init,
  knownPeers,
  getRandomPeers,
  getKnownPeers,
  addPeer,
  connectPeer,
  removePeer,
  disconnectPeer,
  disablePeer,
  askForPeers,
  resetPeers
};
