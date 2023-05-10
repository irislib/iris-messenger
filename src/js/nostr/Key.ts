import { route } from 'preact-router';

import {
  Event,
  generatePrivateKey,
  getPublicKey,
  nip04,
  nip19,
  signEvent,
} from '../lib/nostr-tools';
import localState from '../LocalState';

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
  windowNostrQueue: [],
  isProcessingQueue: false,
  getPublicKey, // TODO confusing similarity to getPubKey
  loginAsNewUser(redirect = false) {
    this.login(this.generateKey(), redirect);
  },
  login(key: any, redirect = false) {
    const shouldRefresh = !!this.key;
    this.key = key;
    localStorage.setItem('iris.myKey', JSON.stringify(key));
    if (shouldRefresh) {
      location.reload();
    }
    localState.get('loggedIn').put(true);
    localState.get('lastOpenedFeed').put('following');
    if (redirect) {
      setTimeout(() => {
        route('/following');
      });
    }
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
  getPubKey() {
    return this.key?.rpub;
  },
  getPrivKey() {
    return this.key?.priv;
  },
  encrypt: async function (data: string, pub?: string): Promise<string> {
    const k = this.key;
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
    const k = this.key;
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
  sign: async function (event: Event): Promise<string> {
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
  async decryptMessage(id, cb: (decrypted: string) => void) {
    const existing = Events.decryptedMessages.get(id);
    if (existing) {
      cb(existing);
      return;
    }
    try {
      const myPub = this.getPubKey();
      const msg = Events.db.by('id', id);
      const theirPub =
        msg.pubkey === myPub ? msg.tags?.find((tag: any) => tag[0] === 'p')[1] : msg.pubkey;
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
  // Encodes npub/note into nprofile/nevent, if necessary.
  _addRelays(address: string) {
    const { data, type } = nip19.decode(address);
    switch (type) {
      case 'npub':
        return nip19.nprofileEncode({
          pubkey: data,
          relays: Events.eventsMetaDb.getRelays(data).slice(0, 5),
        });
      case 'note':
        return nip19.neventEncode({
          id: data,
          relays: Events.eventsMetaDb.getRelays(data).slice(0, 5),
        });
      // These already contain relay data, so keep it.
      case 'nprofile':
      case 'nevent':
      case 'naddr':
        return address;
    }
  },
  // Encodes into nprofile/nevent, adding relays we know of.
  _encodeWithRelays(hexAddress: string, prefix: string) {
    switch (prefix) {
      case 'npub':
      case 'nprofile':
        return nip19.nprofileEncode({
          pubkey: hexAddress,
          relays: Events.eventsMetaDb.getRelays(hexAddress).slice(0, 5),
        });
      case 'nevent':
      case 'note':
        return nip19.neventEncode({
          id: hexAddress,
          relays: Events.eventsMetaDb.getRelays(hexAddress).slice(0, 5),
        });
    }
  },
  toNostrBech32Address: function (address: string, prefix: string) {
    if (!address) {
      return;
    }
    if (!prefix) {
      throw new Error('prefix is required');
    }
    try {
      const addr = this._addRelays(address);
      if (addr) {
        return addr;
      }
    } catch (e) {
      // nop
    }
    try {
      return this._encodeWithRelays(address, prefix);
    } catch {
      // nop
    }
    return null;
  },
  toNostrHexAddress(str: string): string | null {
    if (str.match(/^[0-9a-fA-F]{64}$/)) {
      return str;
    }
    try {
      const { data, type } = nip19.decode(str);
      switch (type) {
        case 'nprofile':
          Events.eventsMetaDb.upsertRelays(data.pubkey, data.relays);
          return data.pubkey;
        case 'nevent':
          Events.eventsMetaDb.upsertRelays(data.id, data.relays);
          return data.id;
        case 'naddr':
          Events.eventsMetaDb.upsertRelays(data.identifier, data.relays);
          return data.identifier;
        case 'note':
        case 'npub':
        case 'nrelay':
        case 'nsec':
          return data;
      }
    } catch (e) {
      // not a bech32 address
    }
    return null;
  },
};
