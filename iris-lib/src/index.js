/*eslint no-useless-escape: "off", camelcase: "off" */

import Gun from 'gun';
import 'gun/sea';

import session from './session';
import peers from './peers';
import util from './util';
import local from './local';
import publicState from './public';
import user from './user';
import group from './group';
import electron from './electron';
import privateState from './private';
import staticState from './static';

import SignedMessage from './SignedMessage';
import Channel from './Channel';
import Node from './Node';

export default {
  /**
   * Initialize the state: start gun instances State.public and State.local
   * @param publicOpts Options for the State.public gun instance
   */
  init(publicOpts) {
    Gun.log.off = true;
    const opts = Object.assign({ peers: peers.random(), localStorage: false, retry:Infinity }, publicOpts);
    publicState(opts);
    if (publicOpts && publicOpts.peers) {
      publicOpts.peers.forEach(url => peers.add({url}));
    }
    util.setPublicState && util.setPublicState(this.public);
    session.init({autologin: window.location.hash.length > 2});
    peers.init();
  },
  local,
  public: publicState,
  group,
  user,
  private: privateState,
  static: staticState,
  electron,
  peers,
  session,
  util,
  algorithms: {},

  SEA: Gun.SEA,
  SignedMessage,
  Channel,
  Node,
};
