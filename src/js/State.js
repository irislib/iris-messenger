import PeerManager from './PeerManager.js';

const State = {
  init: function() {
    Gun.log.off = true;
    this.public = Gun({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity });
    window.publicState = this.public;
    this.local = Gun({peers: [], file: 'State.local', multicast:false, localStorage: false}).get('state');
    window.localState = this.local;
    window.iris.util.setPublicState && window.iris.util.setPublicState(this.public);
  }
};

export default State;
