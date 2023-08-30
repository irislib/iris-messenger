import * as bech32 from 'bech32-buffer'; /* eslint-disable-line @typescript-eslint/no-var-requires */
import {
  Event,
  generatePrivateKey,
  getPublicKey,
  nip04,
  signEvent,
  UnsignedEvent,
} from 'nostr-tools';

import { PublicKey } from '@/utils/Hex/Hex.ts';

import localState from '../state/LocalState.ts';
import Helpers from '../utils/Helpers';

import Events from './Events';

declare global {
  interface Window {
    nostr: any; // possible nostr browser extension
  }
}

type Key = {
  rpub: string;
  priv?: string;
};

export default {
  key: undefined as any,
  windowNostrQueue: [] as any[],
  isProcessingQueue: false,
  getPublicKey, // TODO confusing similarity to getPubKey
  loginAsNewUser() {
    this.login(this.generateKey());
  },
  login(key: any) {
    const shouldRefresh = !!this.key;
    this.key = key;
    localStorage.setItem('iris.myKey', JSON.stringify(key));
    if (shouldRefresh) {
      location.reload();
    }
    localState.get('loggedIn').put(true);
    localState.get('showLoginModal').put(false);
  },
  generateKey(): Key {
    const priv = generatePrivateKey();
    return {
      priv,
      rpub: getPublicKey(priv),
    };
  },
  getOrCreate(options) {
    let localStorageKey = localStorage.getItem('iris.myKey');
    if (!localStorageKey) {
      localStorageKey = localStorage.getItem('chatKeyPair'); // maybe we can already remove this...
    }
    if (localStorageKey) {
      this.key = JSON.parse(localStorageKey);
      if (this.key.secp256k1) {
        this.key = this.key.secp256k1;
        localStorage.setItem('iris.myKey', JSON.stringify(this.key));
      }
      console.log('loaded key from localStorage', this.key);
      localState.get('loggedIn').put(true);
      return true;
    } else if (options.autologin !== false) {
      this.key = this.generateKey();
      localState.get('loggedIn').put(true);
      return true;
    } else {
      return false;
    }
  },
  getPubKey(): string {
    return this.key?.rpub || '';
  },
  getPrivKey(): string {
    return this.key?.priv || '';
  },
  isMine(pubkey: string) {
    try {
      return new PublicKey(pubkey).equals(this.getPubKey());
    } catch (e) {
      return false;
    }
  },
  encrypt: async function (data: string, pub?: string): Promise<string> {
    const k = this.key;
    pub = pub || k.rpub || '';
    if (k.priv) {
      return nip04.encrypt(k.priv, pub as string, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({
          op: 'encrypt',
          data,
          pub,
          callback: resolve,
        });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  decrypt: async function (data, pub?: string): Promise<string> {
    const k = this.key;
    pub = pub || k.rpub || '';
    if (k.priv) {
      return nip04.decrypt(k.priv, pub as string, data);
    } else if (window.nostr) {
      return new Promise((resolve) => {
        this.processWindowNostr({
          op: 'decrypt',
          data,
          pub,
          callback: resolve,
        });
      });
    } else {
      return Promise.reject('no private key');
    }
  },
  sign: async function (event: Event | UnsignedEvent): Promise<string> {
    const priv = this.getPrivKey();
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
      fn = this.handlePromise(window.nostr.signEvent(data), (signed) =>
        callback(signed && signed.sig),
      );
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
        callback(null);
      });
  },
  async decryptMessage(event: Event, cb: (decrypted: string) => void) {
    const existing = Events.decryptedMessages.get(event.id);
    if (existing) {
      cb(existing);
      return;
    }
    try {
      const myPub = this.getPubKey();
      const theirPub =
        event.pubkey === myPub ? event.tags?.find((tag: any) => tag[0] === 'p')?.[1] : event.pubkey;
      if (!(event && theirPub)) {
        return;
      }

      let decrypted = (await this.decrypt(event.content, theirPub)) as any;
      if (decrypted?.content) {
        decrypted = decrypted.content; // what? TODO debug
      }
      Events.decryptedMessages.set(event.id, decrypted);
      cb(decrypted);
    } catch (e) {
      console.error(e);
    }
  },
  async getPubKeyByNip05Address(address: string): Promise<PublicKey | null> {
    try {
      const [localPart, domain] = address.split('@');
      const url = `https://${domain}/.well-known/nostr.json?name=${localPart}`;
      const response = await fetch(url);
      const json = await response.json();
      const names = json.names;
      return new PublicKey(names[localPart]) || null;
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
  toNostrBech32Address: function (address: string, prefix: string) {
    if (!address) {
      return null;
    }
    if (!prefix) {
      throw new Error('prefix is required');
    }
    try {
      const decoded = bech32.decode(address);
      if (prefix !== decoded.prefix) {
        return null;
      }
      return bech32.encode(prefix, decoded.data);
    } catch (e) {
      // not a bech32 address
    }

    const matchResult = address.match(/^[0-9a-fA-F]{64}$/);
    if (matchResult !== null) {
      const wordsArray = matchResult[0].match(/.{1,2}/g);
      if (wordsArray !== null) {
        const words = new Uint8Array(wordsArray.map((byte) => parseInt(byte, 16)));
        return bech32.encode(prefix, words);
      }
    }
    return null;
  },
  toNostrHexAddress(str: string): string | null {
    if (str.match(/^[0-9a-fA-F]{64}$/)) {
      return str;
    }
    try {
      const { data } = bech32.decode(str);
      const addr = Helpers.arrayToHex(data);
      return addr;
    } catch (e) {
      // not a bech32 address
    }
    return null;
  },
};
