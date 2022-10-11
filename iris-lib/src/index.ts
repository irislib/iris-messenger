/*eslint no-useless-escape: "off", camelcase: "off" */

import Gun from 'gun';
import 'gun/sea';

import session from './session';
import peers from './peers';
import util from './util';
import local from './local';
import global from './global';
import publicState from './public';
import group from './group';
import electron from './electron';
import privateState from './private';
import staticState from './static';
import notifications from './notifications';

import SignedMessage from './SignedMessage';
import Channel from './Channel';
import Node from './Node';

export default {
  local,
  global,

  group,
  public: publicState,
  private: privateState,
  static: staticState,
  electron,
  peers,
  session,
  util,
  notifications,

  SEA: Gun.SEA,
  Gun,
  SignedMessage,
  Channel,
  Node,
};