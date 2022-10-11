import Gun from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import peers from "./peers";

let global: any;

export default function(opts: any = {}) {
  if (!global) {
    const myOpts = Object.assign({ peers: (opts.peers || peers.random()), localStorage: false, retry:Infinity }, opts);
    if (opts.peers) {
      opts.peers.forEach((url: string) => peers.add({url}));
    }
    peers.init();
    global = new Gun(myOpts);
  }
  return global;
}