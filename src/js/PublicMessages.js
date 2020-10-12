import {addChat} from './Chat.js';
import { translate as t } from './Translation.js';
import {publicState, localState} from './Main.js';
import Session from './Session.js';

let pub;

function twice(f) {
  f();
  setTimeout(f, 100); // write many times and maybe it goes through :D
}

async function sendPublicMsg(msg) {
  msg.time = new Date().toISOString();
  msg.type = 'post';
  const signedMsg = await iris.SignedMessage.create(msg, Session.getKey());
  const serialized = signedMsg.toString();
  const hash = await iris.util.getHash(serialized);
  publicState.get('#').get(hash).put(serialized);
  if (msg.replyingTo) {
    twice(() => publicState.user().get('replies').get(msg.replyingTo).put({a:null}));
    twice(() => publicState.user().get('replies').get(msg.replyingTo).get(msg.time).put(hash));
  } else {
    publicState.user().get('msgs').get(msg.time).put(hash);
  }
}

function deletePublicMsg(timeStr, replyingTo) {
  publicState.user().get('msgs').get(timeStr).put(null);
  publicState.user().get('replies').get(replyingTo).get(timeStr).put(null);
}

function getMessageByHash(hash) {
  return new Promise(resolve => {
    localState.get('msgsByHash').get(hash).once(msg => {
      if (msg) {
        return resolve(JSON.parse(msg));
      }
      publicState.get('#').get(hash).on(async (serialized, a, b, event) => {
        event.off();
        const msg = await iris.SignedMessage.fromString(serialized);
        resolve(msg);
        localState.get('msgsByHash').get(hash).put(JSON.stringify(msg));
      });
    });
  });
}

function getMessages(pub, cb) {
  const seen = new Set();
  publicState.user(pub).get('msgs').map().on(async (hash, time) => {
    if (typeof hash === 'string' && !seen.has(hash)) {
      seen.add(hash);
      cb(hash, time);
    } else if (hash === null) {
      cb(null, time);
    }
  });
}

function init() {
  const u = () => {};
  pub = {
    name: t('public_messages'),
    messages: {},
    getId: () => 'public',
    send: sendPublicMsg,
    delete: deletePublicMsg,
    getMessages,
    onTheir: u,
    onMy: u,
    getTheirMsgsLastSeenTime: u,
    getMyMsgsLastSeenTime: u,
    getTyping: u,
    setMyMsgsLastSeenTime: u,
    setTyping: u,
  };
  addChat(pub);
}

export default {init, getMessages, getMessageByHash};
