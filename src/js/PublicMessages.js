import {addChat} from './Chat.js';
import { translate as t } from './Translation.js';
import {publicState} from './Main.js';
import Session from './Session.js';

let pub;

async function sendPublicMsg(msg) {
  msg.time = new Date().toISOString();
  msg.type = 'post';
  const signedMsg = await iris.SignedMessage.create(msg, Session.getKey());
  const serialized = signedMsg.toString();
  const hash = await iris.util.getHash(serialized);
  publicState.get('#').get(hash).put(serialized);
  publicState.user().get('msgs').get(msg.time).put(hash);
}

function deletePublicMsg(timeStr) {
  publicState.user().get('msgs').get(timeStr).put(null);
}

function getMessageByHash(hash) {
  return new Promise(resolve => {
    publicState.get('#').get(hash).on(async (serialized, a, b, event) => {
      event.off();
      const msg = await iris.SignedMessage.fromString(serialized);
      resolve(msg);
    });
  });
}

function getMessages(pub, cb) {
  const seen = new Set();
  publicState.user(pub).get('msgs').map().on(async hash => {
    if (typeof hash === 'string' && !seen.has(hash)) {
      seen.add(hash);
      const msg = await getMessageByHash(hash);
      cb(msg.signedData, {hash, selfAuthored: pub === Session.getKey().pub, from: msg.signerKeyHash});
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
