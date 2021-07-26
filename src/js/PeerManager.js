import State from './State.js';
import Helpers from './Helpers.js';
import Session from './Session.js';

var MAX_PEER_LIST_SIZE = 10;
const ELECTRON_GUN_URL = 'http://localhost:8767/gun';
var maxConnectedPeers = iris.util.isElectron ? 2 : 1;
const DEFAULT_PEERS = {
  // 'https://iris.cx/gun': {}, // remove this for now, because sync between them is poor and often unidirectional :D
  'https://gun-us.herokuapp.com/gun': {}
};
var knownPeers = getSavedPeers();

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
    var secret = await Gun.SEA.secret(Session.getKey().epub, Session.getKey());
    var encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
    var encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
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
  var p = localStorage.getItem('gunPeers');
  if (p && p !== 'undefined') {
    p = JSON.parse(p);
  } else {
    p = DEFAULT_PEERS;
  }
  if (iris.util.isElectron) {
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

function getRandomPeers() {
  const connectToLocalElectron = iris.util.isElectron && knownPeers[ELECTRON_GUN_URL] && knownPeers[ELECTRON_GUN_URL].enabled !== false;
  const sampleSize = connectToLocalElectron ? Math.max(maxConnectedPeers - 1, 1) : maxConnectedPeers;
  const sample = _.sample(
    Object.keys(
      _.pick(knownPeers, (p, url) => {
        const mixedContent = (window.location.protocol === 'https:' && (url.indexOf('http:') === 0));
        return !mixedContent && p.enabled && !(iris.util.isElectron && url === ELECTRON_GUN_URL);
      })
    ), sampleSize
  );
  if (connectToLocalElectron) {
    sample.push(ELECTRON_GUN_URL);
  }
  return sample;
}

var askForPeers = _.once(pub => {
  if (!Session.settings.local.enablePublicPeerDiscovery) { return; }
  _.defer(() => {
    State.public.user(pub).get('peers').once().map().on(peer => {
      if (peer && peer.url) {
        var peerCountBySource = _.countBy(knownPeers, p => p.from);
        var peerSourceCount = Object.keys(peerCountBySource).length;
        if (!peerCountBySource[pub]) {
          peerSourceCount += 1;
        }
        var maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
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
  var peersFromGun = State.public.back('opt.peers');
  var connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
    if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
      console.log('WebRTC peer', peer);
    }
    return peer && peer.wire && peer.wire.hied === 'hi' && peer.wire.constructor.name === 'WebSocket';
  });
  if (connectedPeers.length < maxConnectedPeers) {
    var unconnectedPeers = _.filter(Object.keys(knownPeers), url => {
      var addedToGun = _.pluck(Object.values(peersFromGun), 'url').indexOf(url) > -1;
      var enabled = knownPeers[url].enabled;
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
