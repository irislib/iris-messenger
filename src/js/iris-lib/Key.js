/*eslint no-useless-escape: "off", camelcase: "off" */

import util from './util';
import Gun from 'gun'; // eslint-disable-line no-unused-vars
import 'gun/sea';
// eslint-disable-line no-unused-vars

let myKey;

/**
* Key management utils. Wraps GUN's Gun.SEA. https://gun.eco/docs/Gun.SEA
*/
class Key {
  /**
  * Load private key from datadir/iris.key on node.js or from local storage 'iris.myKey' in browser.
  *
  * If the key does not exist, it is generated.
  * @param {string} datadir directory to find key from. In browser, localStorage is used instead.
  * @param {string} keyfile keyfile name (within datadir)
  * @param {Object} fs node: require('fs'); browser: leave empty.
  * @returns {Promise<Object>} keypair object
  */
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

  /**
  *
  */
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

  /**
  * Serialize key as JSON string
  * @param {Object} key key to serialize
  * @returns {String} JSON Web Key string
  */
  static toString(key) {
    return JSON.stringify(key);
  }

  /**
  * Get keyID
  * @param {Object} key key to get an id for. Currently just returns the public key string.
  * @returns {String} public key string
  */
  static getId(key) {
    if (!(key && key.pub)) {
      throw new Error(`missing param`);
    }
    return key.pub; // hack until GUN supports lookups by keyID
    //return util.getHash(key.pub);
  }

  /**
  * Get a keypair from a JSON string.
  * @param {String} str key JSON
  * @returns {Object} Gun.SEA keypair object
  */
  static fromString(str) {
    return JSON.parse(str);
  }

  /**
  * Generate a new keypair
  * @returns {Promise<Object>} Gun.SEA keypair object
  */
  static generate() {
    return Gun.SEA.pair();
  }

  /**
  * Sign a message
  * @param {String} msg message to sign
  * @param {Object} pair signing keypair
  * @returns {Promise<String>} signed message string
  */
  static async sign(msg, pair) {
    const sig = await Gun.SEA.sign(msg, pair);
    return `a${sig}`;
  }

  /**
  * Verify a signed message
  * @param {String} msg message to verify
  * @param {Object} pubKey public key of the signer
  * @returns {Promise<String>} signature string
  */
  static verify(msg, pubKey) {


    return Gun.SEA.verify(msg.slice(1), pubKey);
  }
}

export default Key;
