import {addChat} from './Chat.js';
import { translate as t } from './Translation.js';
import State from './State.js';
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
  State.public.get('#').get(hash).put(serialized);
  if (msg.replyingTo) {
    twice(() => State.public.user().get('replies').get(msg.replyingTo).put({a:null}));
    twice(() => State.public.user().get('replies').get(msg.replyingTo).get(msg.time).put(hash));
  } else {
    State.public.user().get('msgs').get(msg.time).put(hash);
  }
}

function deletePublicMsg(timeStr, replyingTo) {
  State.public.user().get('msgs').get(timeStr).put(null);
  replyingTo && State.public.user().get('replies').get(replyingTo).get(timeStr).put(null);
}

function getMessageByHash(hash) {
  if (typeof hash !== 'string') throw new Error('hash must be a string, got ' + typeof hash + ' ' +  JSON.stringify(hash));
  return new Promise(resolve => {
    State.local.get('msgsByHash').get(hash).once(msg => {
      if (typeof msg === 'string') {
        try {
          resolve(JSON.parse(msg));
        } catch (e) {
          console.error('message parsing failed', msg, e);
        }
      }
    });
    State.public.get('#').get(hash).on(async (serialized, a, b, event) => {
      if (typeof serialized !== 'string') {
        console.error('message parsing failed', hash, serialized);
        return;
      }
      event.off();
      const msg = await iris.SignedMessage.fromString(serialized);
      if (msg) {
        resolve(msg);
        State.local.get('msgsByHash').get(hash).put(JSON.stringify(msg));
      }
    });
  });
}

function getMessages(pub, cb) {
  const seen = new Set();
  State.public.user(pub).get('msgs').map().on(async (hash, time) => {
    if (typeof hash === 'string' && !seen.has(hash)) {
      seen.add(hash);
      cb(hash, time);
    } else if (hash === null) {
      cb(null, time);
    }
  });
}

export default {getMessages, getMessageByHash};
