/*eslint no-useless-escape: "off", camelcase: "off" */
import Identicon from 'identicon';
import util from './util';

const UNIQUE_ID_VALIDATORS = {
  email: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
  bitcoin: /^[13][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
  bitcoin_address: /^[13][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
  ip: /^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/,
  ipv6: /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/,
  gpg_fingerprint: null,
  gpg_keyid: null,
  google_oauth2: null,
  tel: /^\d{7,}$/,
  phone: /^\d{7,}$/,
  keyID: null,
  url: /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi,
  account: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
  uuid: /[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}/
};

/**
* A simple key-value pair with helper functions.
*
* Constructor: new Attribute(value), new Attribute(type, value) or new Attribute({type, value})
*/
class Attribute {
  /**
  * @param {string} a
  * @param {string} b
  */
  constructor(a, b) {
    if (typeof a === `object`) {
      if (typeof a.value !== `string`) { throw new Error(`param1.value must be a string, got ${typeof a.value}: ${JSON.stringify(a.value)}`); }
      if (typeof a.type !== `string`) { throw new Error(`param1.type must be a string, got ${typeof a.type}: ${JSON.stringify(a.type)}`); }
      b = a.value;
      a = a.type;
    }
    if (typeof a !== `string`) { throw new Error(`First param must be a string, got ${typeof a}: ${JSON.stringify(a)}`); }
    if (!a.length) { throw new Error(`First param string is empty`); }
    if (b) {
      if (typeof b !== `string`) { throw new Error(`Second parameter must be a string, got ${typeof b}: ${JSON.stringify(b)}`); }
      if (!b.length) { throw new Error(`Second param string is empty`); }
      this.type = a;
      this.value = b;
    } else {
      this.value = a;
      const t = Attribute.guessTypeOf(this.value);
      if (t) {
        this.type = t;
      } else {
        throw new Error(`Type of attribute was omitted and could not be guessed`);
      }
    }
  }

  /**
  * @returns {Attribute} uuid
  */
  static getUuid() {
    const b = a => a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
    return new Attribute(`uuid`, b());
  }

  /**
  * @returns {Object} an object with attribute types as keys and regex patterns as values
  */
  static getUniqueIdValidators() {
    return UNIQUE_ID_VALIDATORS;
  }

  /**
  * @param {string} type attribute type
  * @returns {boolean} true if the attribute type is unique
  */
  static isUniqueType(type) {
    return Object.keys(UNIQUE_ID_VALIDATORS).indexOf(type) > -1;
  }

  /**
  * @returns {boolean} true if the attribute type is unique
  */
  isUniqueType() {
    return Attribute.isUniqueType(this.type);
  }

  /**
  * @param {string} value guess type of this attribute value
  * @returns {string} type of attribute value or undefined
  */
  static guessTypeOf(value) {
    for (const key in UNIQUE_ID_VALIDATORS) {
      if (value.match(UNIQUE_ID_VALIDATORS[key])) {
        return key;
      }
    }
  }

  /**
  * @param {Attribute} a
  * @param {Attribute} b
  * @returns {boolean} true if params are equal
  */
  static equals(a, b) {
    return a.equals(b);
  }

  /**
  * @param {Attribute} a attribute to compare to
  * @returns {boolean} true if attribute matches param
  */
  equals(a) {
    return a && this.type === a.type && this.value === a.value;
  }

  /**
  * @returns {string} uri - `${encodeURIComponent(this.value)}:${encodeURIComponent(this.type)}`
  * @example
  * user%20example.com:email
  */
  uri() {
    return `${encodeURIComponent(this.value)}:${encodeURIComponent(this.type)}`;
  }

  identiconXml(options = {}) {
    return util.getHash(`${encodeURIComponent(this.type)}:${encodeURIComponent(this.value)}`, `hex`)
      .then(hash => {
        const identicon = new Identicon(hash, {width: options.width, format: `svg`});
        return identicon.toString(true);
      });
  }

  identiconSrc(options = {}) {
    return util.getHash(`${encodeURIComponent(this.type)}:${encodeURIComponent(this.value)}`, `hex`)
      .then(hash => {
        const identicon = new Identicon(hash, {width: options.width, format: `svg`});
        return `data:image/svg+xml;base64,${identicon.toString()}`;
      });
  }

  /**
  * Generate a visually recognizable representation of the attribute
  * @param {object} options {width}
  * @returns {HTMLElement} identicon div element
  */
  identicon(options = {}) {
    options = Object.assign({
      width: 50,
      showType: true,
    }, options);
    util.injectCss(); // some other way that is not called on each identicon generation?

    const div = document.createElement(`div`);
    div.className = `iris-identicon`;
    div.style.width = `${options.width}px`;
    div.style.height = `${options.width}px`;

    const img = document.createElement(`img`);
    img.alt = ``;
    img.width = options.width;
    img.height = options.width;
    this.identiconSrc(options).then(src => img.src = src);

    if (options.showType) {
      const name = document.createElement(`span`);
      name.className = `iris-distance`;
      name.style.fontSize = options.width > 50 ? `${options.width / 4}px` : `10px`;
      name.textContent = this.type.slice(0, 5);
      div.appendChild(name);
    }

    div.appendChild(img);

    return div;
  }
}

export default Attribute;
