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
import notifications from './notifications';

import SignedMessage from './SignedMessage';
import Channel from './Channel';
import Node from './Node';

Gun.log.off = true;

export default {
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
  notifications,

  SEA: Gun.SEA,
  Gun,
  SignedMessage,
  Channel,
  Node,
};
