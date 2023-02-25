import iris from 'iris-lib';

import { Event, nip04, signEvent } from '../lib/nostr-tools';

import Events from './Events';

export default {
  windowNostrQueue: [],
  isProcessingQueue: false,
  getPubKey() {
    return iris.session.getKey()?.secp256k1?.rpub; // TODO use this everywhere :D
  },
  encrypt: async function (data: string, pub?: string): Promise<string> {
    const k = iris.session.getKey().secp256k1;
    pub = pub || k.rpub;
    if (k.priv) {
      return nip04.encrypt(k.priv, pub, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'encrypt', data, pub, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  decrypt: async function (data, pub?: string): Promise<string> {
    const k = iris.session.getKey().secp256k1;
    pub = pub || k.rpub;
    if (k.priv) {
      return nip04.decrypt(k.priv, pub, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'decrypt', data, pub, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  sign: async function (event: Event) {
    const priv = iris.session.getKey().secp256k1.priv;
    if (priv) {
      return signEvent(event, priv);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({ op: 'sign', data: event, callback: resolve });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  processWindowNostr(item: any) {
    this.windowNostrQueue.push(item);
    if (!this.isProcessingQueue) {
      this.processWindowNostrQueue();
    }
  },
  async processWindowNostrQueue() {
    if (!this.windowNostrQueue.length) {
      this.isProcessingQueue = false;
      return;
    }
    this.isProcessingQueue = true;
    const { op, data, pub, callback } = this.windowNostrQueue[0];

    let fn = Promise.resolve();
    if (op === 'decrypt') {
      fn = this.handlePromise(window.nostr.nip04.decrypt(pub, data), callback);
    } else if (op === 'encrypt') {
      fn = this.handlePromise(window.nostr.nip04.encrypt(pub, data), callback);
    } else if (op === 'sign') {
      fn = this.handlePromise(window.nostr.signEvent(data), (signed) => callback(signed.sig));
    }
    await fn;
    this.windowNostrQueue.shift();
    this.processWindowNostrQueue();
  },
  handlePromise(promise, callback) {
    return promise
      .then((result) => {
        callback(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
  async decryptMessage(id, cb: (decrypted: string) => void) {
    const existing = Events.decryptedMessages.get(id);
    if (existing) {
      cb(existing);
      return;
    }
    try {
      const myPub = this.getPubKey();
      const msg = Events.cache.get(id);
      const theirPub =
        msg.pubkey === myPub ? msg.tags.find((tag: any) => tag[0] === 'p')[1] : msg.pubkey;
      if (!(msg && theirPub)) {
        return;
      }

      let decrypted = await this.decrypt(msg.content, theirPub);
      if (decrypted.content) {
        decrypted = decrypted.content; // what? TODO debug
      }
      Events.decryptedMessages.set(id, decrypted);
      cb(decrypted);
    } catch (e) {
      console.error(e);
    }
  },
  async getPubKeyByNip05Address(address: string): Promise<string | null> {
    try {
      const [localPart, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${localPart}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return names[localPart] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
  async verifyNip05Address(address: string, pubkey: string): Promise<boolean> {
    try {
      const [username, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${username}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return names[username] === pubkey || names[username.toLowerCase()] === pubkey;
    } catch (error) {
      // gives lots of cors errors:
      // console.error(error);
      return false;
    }
  },
};
