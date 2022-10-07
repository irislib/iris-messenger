import Gun from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import peers from "./peers";

let publicState;

export default function(opts = {}) {
  if (!publicState) {
    const myOpts = Object.assign({ peers: (opts.peers || peers.random()), localStorage: false, retry:Infinity }, opts);
    if (opts.peers) {
      opts.peers.forEach(url => peers.add({url}));
    }
    peers.init();
    publicState = new Gun(myOpts);
  }
  return publicState;
}