import Gun, { IGunInstance, IGunChain, IGunUserInstance } from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import _ from 'lodash';

import PeerManager from './PeerManager';
import iris from './iris-lib';
import Helpers from './Helpers';

type Opts = {
  peers: string[];
}

type Follows = Record<string, boolean>;

type BlockedUsers = Record<string, boolean>;

type Callback = (node: IGunUserInstance, user: string) => void;

type Group = {
  get: (path: string, callback: Callback) => void;
  map: (path: string, callback: Callback) => void;
  on: (path: string, callback: Callback) => void;
}

export type State = {
  public?: IGunInstance;
  local?: IGunChain<any>;
  electron?: IGunChain<any>;
  blockedUsers?: BlockedUsers;
  init: (publicOpts: Opts) => void;
  getBlockedUsers: () => BlockedUsers | undefined;
  group: (groupNode?: string | IGunChain<any>) => Group;
}

const state: State = {
  init(publicOpts) {
    Gun.log.off = true;
    const o = Object.assign({ peers: PeerManager.getRandomPeers(), localStorage: false, retry:Infinity }, publicOpts);
    this.public = Gun(o);
    if (publicOpts && publicOpts.peers) {
      publicOpts.peers.forEach(url => PeerManager.addPeer({url}));
    }
    this.local = Gun({peers: [], multicast:false, rad: false, localStorage: true}).get('state');
    if (Helpers.isElectron) {
      this.electron = Gun({peers: ['http://localhost:8768/gun'], file: 'State.electron', multicast:false, localStorage: false}).get('state');
    }
    this.blockedUsers = {};

    // Is this the right place for this?
    this.local.get('block').map().on((isBlocked, user) => {
      if (this.blockedUsers === undefined) { return; }
      if (this.local === undefined) { return; }
      if (isBlocked === this.blockedUsers[user]) { return; }
      if (isBlocked) {
        this.blockedUsers[user] = isBlocked;
        this.local.get('groups').map().once((_v, k) => {
          if (this.local === undefined) { return; }
          this.local.get('groups').get(k).get(user).put(false);
        });
      } else {
        delete this.blockedUsers[user];
      }
    });

    window.State = this;
    iris.util.setPublicState && iris.util.setPublicState(this.public);
  },

  getBlockedUsers() {
    return this.blockedUsers;
  },

  group(groupNode = 'everyone') {
    return {
      get: (path, callback) => {
        requestAnimationFrame(() => {
          const follows: Follows = {};
          if (typeof groupNode === 'string') {
            if (this.local === undefined) { return; }
            groupNode = this.local.get('groups').get(groupNode);
          }
          groupNode.map((isFollowing, user) => {
            if (this.blockedUsers === undefined) { return; }
            if (this.blockedUsers[user]) { return; } // TODO: allow to specifically query blocked users?
            if (follows[user] && follows[user] === isFollowing) { return; }
            follows[user] = isFollowing;
            if (isFollowing) { // TODO: callback on unfollow, for unsubscribe
              if (state.public === undefined) { return; }
              let node = state.public.user(user);
              if (path && path !== '/') {
                node = _.reduce(path.split('/'), (sum, s) => sum.get(decodeURIComponent(s)), node);
              }
              callback(node, user);
            }
          })
        });
      },

      map(path, callback) {
        this.get(path, (node, from) => node.map((...args) => callback(...args, from)));
      },

      on(path, callback) {
        this.get(path, (node, from) => node.on((...args) => callback(...args, from)));
      }
    }
  },
};

export default state;
