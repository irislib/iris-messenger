import {publicState} from './Main.js';
import {chats, showChat, getDisplayName} from './Chat.js';
import Helpers from './Helpers.js';
import Session from './Session.js';
import {translate as t} from './Translation.js';

var MAX_PEER_LIST_SIZE = 10;
var MAX_CONNECTED_PEERS = iris.util.isElectron ? 4 : 2;
const DEFAULT_PEERS = {
  'https://gun-eu.herokuapp.com/gun': {},
  'https://gun-us.herokuapp.com/gun': {}
};
var peers = getPeers();

async function addPeer(peer) {
  if (!Helpers.isUrl(peer.url)) {
    throw new Error('Invalid url', peer.url);
  }
  peers[peer.url] = peers[peer.url] || _.omit(peer, 'url');
  if (peer.visibility === 'public') {
    // rolling some crypto operations to obfuscate actual url in case we want to remove it
    var secret = await Gun.SEA.secret(Session.getKey().epub, Session.getKey());
    var encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
    var encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
    publicState.user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
  }
  if (peer.enabled !== false) {
    connectPeer(peer.url);
  } else {
    savePeers();
  }
}

function removePeer(url) {
  delete peers[url];
  savePeers();
}

function disconnectPeer(peerFromGun) {
  publicState.on('bye', peerFromGun);
  peerFromGun.url = '';
}

function getPeers() {
  var p = localStorage.getItem('gunPeers');
  if (p && p !== 'undefined') {
    p = JSON.parse(p);
    p = Object.assign({}, DEFAULT_PEERS, p);
  } else {
    p = DEFAULT_PEERS;
  }
  if (iris.util.isElectron) {
    p['http://localhost:8767/gun'] = {};
  }
  Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
  return p;
}

function resetPeers() {
  localStorage.setItem('gunPeers', undefined);
  peers = getPeers();
}

function savePeers() {
  localStorage.setItem('gunPeers', JSON.stringify(peers));
}

function connectPeer(url) {
  if (peers[url]) {
    peers[url].enabled = true;
    publicState.opt({peers: [url]});
    savePeers();
  } else {
    addPeer({url});
  }
}

function disablePeer(url, peerFromGun) {
  peers[url].enabled = false;
  if (peerFromGun) {
    disconnectPeer(peerFromGun);
  }
  savePeers();
}

function getRandomPeers() {
  return _.sample(
    Object.keys(
      _.pick(peers, p => { return p.enabled; })
    ), MAX_CONNECTED_PEERS
  );
}

var askForPeers = _.once(pub => {
  _.defer(() => {
    publicState.user(pub).get('peers').once().map().on(peer => {
      if (peer && peer.url) {
        var peerCountBySource = _.countBy(peers, p => p.from);
        var peerSourceCount = Object.keys(peerCountBySource).length;
        if (!peerCountBySource[pub]) {
          peerSourceCount += 1;
        }
        var maxPeersFromSource = MAX_PEER_LIST_SIZE / peerSourceCount;
        addPeer({url: peer.url, connect: true, from: pub});
        while (Object.keys(peers).length > MAX_PEER_LIST_SIZE) {
          _.each(Object.keys(peerCountBySource), source => {
            if (peerCountBySource[source] > maxPeersFromSource) {
              delete peers[_.sample(Object.keys(peers))];
              peerCountBySource[source] -= 1;
            }
          });
        }
      }
    });
  });
});

function checkGunPeerCount() {
  var peersFromGun = publicState.back('opt.peers');
  var connectedPeers = _.filter(Object.values(peersFromGun), (peer) => {
    return peer && peer.wire && peer.wire.hied === 'hi';
  });
  if (connectedPeers.length < MAX_CONNECTED_PEERS) {
    var unconnectedPeers = _.filter(Object.keys(peers), url => {
      var addedToGun = _.pluck(Object.values(peersFromGun), 'url').indexOf(url) > -1;
      var enabled = peers[url].enabled;
      return enabled && !addedToGun;
    });
    if (unconnectedPeers.length) {
      connectPeer(_.sample(unconnectedPeers));
    }
  }
  if (connectedPeers.length > MAX_CONNECTED_PEERS) {
    disconnectPeer(_.sample(connectedPeers));
  }
}

function updatePeerList() {
  var peersFromGun = publicState.back('opt.peers');
  $('#peers .peer').remove();
  $('#reset-peers').remove();
  var urls = Object.keys(peers);
  if (urls.length === 0) {
    var resetBtn = $('<button>').attr('id', 'reset-peers').css({'margin-bottom': '15px'}).text(t('restore_defaults')).click(() => {
      resetPeers();
      updatePeerList();
    });
    $('#peers').prepend(resetBtn);
  }
  urls.forEach(url => {
    var peer = peers[url];
    var peerFromGun = peersFromGun[url];
    var connected = peerFromGun && peerFromGun.wire && peerFromGun.wire.hied === 'hi';
    var row = $('<div>').addClass('flex-row peer');
    var urlEl = $('<div>').addClass('flex-cell').text(url);
    var removeBtn = $('<button>').text(t('remove')).click(() => {
      Helpers.hideAndRemove(row); // this may be screwed by setInterval removing before animation finished
      removePeer(url);
      if (peerFromGun) {
        disconnectPeer(peerFromGun);
      }
    });
    var connectBtn = $('<button>').text(peer.enabled ? t('disable') : t('enable')).click(function() {
      if (peer.enabled) {
        disablePeer(url, peerFromGun);
      } else {
        connectPeer(url);
      }
      updatePeerList();
    });
    row.append(urlEl).append($('<div>').addClass('flex-cell no-flex').append(connectBtn).append(removeBtn));
    if (connected) {
      row.prepend('+ ');
    } else {
      row.prepend('- ');
    }
    if (peer.from) {
      urlEl.append($('<br>'));
      urlEl.append(
        $('<small>').text(t('from') + ' ' + ((chats[peer.from] && getDisplayName(peer.from)) || Helpers.truncateString(peer.from, 10)))
        .css({cursor:'pointer'}).click(() => showChat(peer.from))
      );
    }
    $('#peers').prepend(row);
  });
}

function init() {
  updatePeerList();
  setInterval(updatePeerList, 2000);
  setInterval(checkGunPeerCount, 10000);
}

export default {
  init,
  peers,
  getRandomPeers,
  getPeers,
  addPeer,
  connectPeer,
  removePeer,
  disconnectPeer,
  disablePeer,
  askForPeers,
  updatePeerList,
  checkGunPeerCount
};
