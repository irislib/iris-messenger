import PeerManager from './PeerManager.js';

const State = {
  init: function(publicOpts) {
    Gun.log.off = true;
    const o = Object.assign({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity }, publicOpts);
    this.public = Gun(o);
    if (publicOpts && publicOpts.peers) {
      publicOpts.peers.forEach(url => PeerManager.addPeer({url}));
    }
    window.publicState = this.public;
    this.local = Gun({peers: [], file: 'State.local', multicast:false, localStorage: false}).get('state');
    if (iris.util.isElectron) {
      this.electron = Gun({peers: ['http://localhost:8768/gun'], file: 'State.local', multicast:false, localStorage: false}).get('state');
      window.electronState = this.electron;
    }
    window.localState = this.local;
    window.iris.util.setPublicState && window.iris.util.setPublicState(this.public);
  }
};

export default State;
