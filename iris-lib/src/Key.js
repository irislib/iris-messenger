/*eslint no-useless-escape: "off", camelcase: "off" */

import util from './util';
import Gun from 'gun'; // eslint-disable-line no-unused-vars
import 'gun/sea';
// eslint-disable-line no-unused-vars

let myKey;

class Key {
  static async getActiveKey(datadir = `.`, keyfile = `iris.key`, fs) {
    if (myKey) {
      return myKey;
    }
    if (fs) {
      const privKeyFile = `${datadir}/${keyfile}`;
      if (fs.existsSync(privKeyFile)) {
        const f = fs.readFileSync(privKeyFile, `utf8`);
        myKey = Key.fromString(f);
      } else {
        const newKey = await Key.generate();
        myKey = myKey || newKey; // eslint-disable-line require-atomic-updates
        fs.writeFileSync(privKeyFile, Key.toString(myKey));
        fs.chmodSync(privKeyFile, 400);
      }
      if (!myKey) {
        throw new Error(`loading default key failed - check ${datadir}/${keyfile}`);
      }
    } else {
      const str = window.localStorage.getItem(`iris.myKey`);
      if (str) {
        myKey = Key.fromString(str);
      } else {
        const newKey = await Key.generate();
        myKey = myKey || newKey; // eslint-disable-line require-atomic-updates
        window.localStorage.setItem(`iris.myKey`, Key.toString(myKey));
      }
      if (!myKey) {
        throw new Error(`loading default key failed - check localStorage iris.myKey`);
      }
    }
    return myKey;
  }

  static getDefault(datadir = `.`, keyfile = `iris.key`) {
    return Key.getActiveKey(datadir, keyfile);
  }

  static async getActivePub(datadir = `.`, keyfile = `iris.key`) {
    const key = await Key.getActiveKey(datadir, keyfile);
    return key.pub;
  }

  static setActiveKey(key, save = true, datadir = `.`, keyfile = `iris.key`, fs) {
    myKey = key;
    if (!save) return;
    if (util.isNode) {
      const privKeyFile = `${datadir}/${keyfile}`;
      fs.writeFileSync(privKeyFile, Key.toString(myKey));
      fs.chmodSync(privKeyFile, 400);
    } else {
      window.localStorage.setItem(`iris.myKey`, Key.toString(myKey));
    }
  }

  static toString(key) {
    return JSON.stringify(key);
  }

  static getId(key) {
    if (!(key && key.pub)) {
      throw new Error(`missing param`);
    }
    return key.pub; // hack until GUN supports lookups by keyID
    //return util.getHash(key.pub);
  }

  static fromString(str) {
    return JSON.parse(str);
  }

  static generate() {
    return Gun.SEA.pair();
  }

  static async sign(msg, pair) {
    const sig = await Gun.SEA.sign(msg, pair);
    return `a${sig}`;
  }

  static verify(msg, pubKey) {
    return Gun.SEA.verify(msg.slice(1), pubKey);
  }
}

export default Key;
