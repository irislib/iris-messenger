import State from './State.js';
import Session from './Session.js';

function twice(f) {
  f();
  setTimeout(f, 100); // write many times and maybe it goes through :D
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
