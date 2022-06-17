import Gun from 'gun';
import 'gun/sea';
import util from './util';
import Attribute from './Attribute';

/**
* Private communication channel between two or more participants ([Gun](https://github.com/amark/gun) public keys). Can be used independently of other Iris stuff.
*
* Used as a core element of [iris-messenger](https://github.com/irislib/iris-messenger).
*
* ---
*
* #### Key-value API
* `channel.put(key, value)` and `channel.on(key, callback)`.
*
* Note that each participant has their own versions of each key-value — they don't overwrite each other. `channel.on()` callback returns them all by default and has a parameter that indicates whose value you got.
*
* While values are encrypted, encryption of keys is not implemented yet.
*
* #### Message API
* `channel.send()` and `channel.getMessages()` for timestamp-indexed chat-style messaging.
*
* Message data is encrypted, but timestamps are public so that peers can return your messages in a sequential order.
*
* ---
*
* You can open a channel with yourself for a private key-value space or a "note to self" type chat with yourself.
*
* **Note!** As of April 2020 Gun.SEA hashing function [is broken on Safari](https://github.com/amark/gun/issues/892). Channels don't work on Safari unless you patch sea.js by adding [this line](https://github.com/irislib/iris-messenger/blob/1e012581793485e6b8b5ed3c2ad0629716709366/src/js/sea.js#L270).
*
* **Privacy disclaimer:** Channel ids, data values and messages are encrypted, but message timestamps are unencrypted so that peers can return them to you in a sequential order. By looking at the unencrypted timestamps (or Gun subscriptions), it is possible to guess who are communicating with each other. This could be improved by indexing messages by *day* only, so making the guess would be more difficult, while you could still return them in a semi-sequential order.
*
* @param {Object} options
* @param {string} options.key your keypair
* @param {Object} options.gun [gun](https://github.com/amark/gun) instance
* @param options.participants (optional) string or string array or permissions object ({'pub1':{read:true,write:true,admin:false},'pub2'...}) of participant public keys (your own key is included by default)
* @param {string} options.chatLink (optional) chat link instead of participants list
* @param {string} options.uuid (group channels only) unique channel identifier. Leave out for new channel.
* @param {string} options.name (group channels only) channel name
* @example
* // Copy & paste this to console at https://iris.to or other page that has gun, sea and iris-lib
* // Due to an unsolved bug, someoneElse's messages only start showing up after a reload
*
* var gun1 = new Gun('https://gun-us.herokuapp.com/gun');
* var gun2 = new Gun('https://gun-us.herokuapp.com/gun');
* var myKey = await iris.Key.getDefault();
* var someoneElse = localStorage.getItem('someoneElsesKey');
* if (someoneElse) {
*  someoneElse = JSON.parse(someoneElse);
* } else {
*  someoneElse = await iris.Key.generate();
*  localStorage.setItem('someoneElsesKey', JSON.stringify(someoneElse));
* }
*
* iris.Channel.initUser(gun1, myKey); // saves myKey.epub to gun.user().get('epub')
* iris.Channel.initUser(gun2, someoneElse);
*
* var ourChannel = new iris.Channel({key: myKey, gun: gun1, participants: someoneElse.pub});
* var theirChannel = new iris.Channel({key: someoneElse, gun: gun2, participants: myKey.pub});
*
* var myChannels = {}; // you can list them in a user interface
* function printMessage(msg, info) {
*  console.log(`[${new Date(msg.time).toLocaleString()}] ${info.from.slice(0,8)}: ${msg.text}`)
* }
* iris.Channel.getChannels(gun1, myKey, channel => {
*  var pub = channel.getCurrentParticipants()[0];
*  gun1.user(pub).get('profile').get('name').on(name => channel.name = name);
*  myChannels[pub] = channel;
*  channel.getMessages(printMessage);
*  channel.on('mood', (mood, from) => console.log(from.slice(0,8) + ' is feeling ' + mood));
* });
*
* // you can play with these in the console:
* ourChannel.send('message from myKey');
* theirChannel.send('message from someoneElse');
*
* ourChannel.put('mood', 'blessed');
* theirChannel.put('mood', 'happy');
*
* @example https://github.com/irislib/iris-lib/blob/master/__tests__/Channel.js
*/
class Channel {
  constructor(options) {
    this.DEFAULT_PERMISSIONS = {read: true, write: true};
    this.key = options.key;
    this.gun = options.gun;
    this.myGroupSecret = options.myGroupSecret;
    this.theirSecretUuids = {};
    this.theirGroupSecrets = {};
    this.user = this.gun.user();
    this.user.auth(this.key);
    this.user.put({epub: this.key.epub});
    this.secrets = {}; // maps participant public key to shared secret
    this.ourSecretChannelIds = {}; // maps participant public key to our secret mutual channel id
    this.theirSecretChannelIds = {}; // maps participant public key to their secret mutual channel id
    this.messages = {};
    this.chatLinks = {};
    this.groupSubscriptions = {};
    this.directSubscriptions = {};
    this.getParticipantsCallbacks = {};

    if (options.chatLink) {
      this.useChatLink(options);
    }

    if (typeof options.participants === `string`) {
      this.addParticipant(options.participants, options.save);
    } else if (Array.isArray(options.participants)) {
      const o = {};
      options.participants.forEach(p => o[p] = Object.assign({}, this.DEFAULT_PERMISSIONS));
      options.participants = o;
    }
    if (typeof options.participants === `object`) { // it's a group channel
      const keys = Object.keys(options.participants);
      keys.forEach(k => {
        if (k !== this.key.pub) {
          this.addParticipant(k, options.save, Object.assign({}, this.DEFAULT_PERMISSIONS, options.participants[k]));
        }
      });
      options.participants[this.key.pub] = options.participants[this.key.pub] || Object.assign({}, this.DEFAULT_PERMISSIONS);
      if (options.uuid) {
        this.uuid = options.uuid;
        this.name = options.name;
      } else {
        options.uuid = Attribute.getUuid().value;
        this.uuid = options.uuid;
        options.participants[this.key.pub].admin = true;
        options.participants[this.key.pub].founder = true;
      }
      this.getChatLinks({subscribe: true});
    }
    this.participants = options.participants;
    if (options.uuid) { // It's a group channel
      // share secret uuid with other participants. since secret is already non-deterministic, maybe uuid could also be?
      // generate channel-specific secret and share it with other participants
      // put() keys should be encrypted first? so you could do put(uuid, secret)
      // what if you join the channel with 2 unconnected devices? on reconnect, the older secret would be overwritten and messages unreadable. maybe participants should store each others' old keys? or maybe you should store them and re-encrypt old stuff when key changes? return them with map() instead?
      this.putDirect(`S${this.uuid}`, this.getMyGroupSecret());
      this.getMySecretUuid().then(s => {
        this.putDirect(this.uuid, s); // TODO: encrypt keys in put()
      });
      this.onTheirDirect(this.uuid, (s, k, from) => {
        this.theirSecretUuids[from] = s;
      });
      this.onTheirDirect(`S${this.uuid}`, (s, k, from) => {
        this.theirGroupSecrets[from] = s;
      });
      // need to make put(), on(), send() and getMessages() behave differently when it's a group and retain the old versions for mutual signaling
    }
    this.onTheir(`participants`, (participants, k, from) => {
      let hasAdmin = false;
      const keys = Object.keys(this.participants);
      for (let i = 0; i < keys.length; i++) {
        if (this.participants[keys[i]].admin || this.participants[keys[i]].inviter) {
          hasAdmin = true;
          break;
        }
      }
      if (!hasAdmin) {
        keys.forEach(k => this.participants[k].admin = true); // if no admins, make everyone admin
      }
      if (this.participants[from] && (this.participants[from].admin || this.participants[from].inviter)) {
        if (typeof participants === `object`) {
          if (JSON.stringify(this.participants) === JSON.stringify(participants)) { return; }
          this.participants = participants;
          delete this.participants[from].inviter;
          Object.keys(participants).forEach(k => {
            if (k !== this.key.pub) {
              this.addParticipant(k, true, Object.assign({}, this.DEFAULT_PERMISSIONS, participants[k]), true);
            }
          });
          this.participantsChanged();
          options.saved = true;
        }
      }
    });
    if (!options.saved && (options.save === undefined || options.save === true)) {
      this.save();
    }
  }

  useChatLink(options) {
    const s = options.chatLink.split('?');
    if (s.length === 2) {
      const chatWith = util.getUrlParameter('chatWith', s[1]);
      const channelId = util.getUrlParameter('channelId', s[1]);
      const inviter = util.getUrlParameter('inviter', s[1]);
      const pub = inviter || chatWith;
      if (chatWith) {
        options.participants = pub;
      } else if (channelId && inviter && inviter !== this.key.pub) { // TODO! initializing it twice breaks things - new secret is generated
        options.uuid = channelId;
        options.participants = {};
        options.participants[inviter] = Object.assign({inviter: true}, this.DEFAULT_PERMISSIONS);
      }
      if (pub !== this.key.pub) {
        const sharedSecret = util.getUrlParameter('s', s[1]);
        const linkId = util.getUrlParameter('k', s[1]);
        if (sharedSecret && linkId) {
          this.save(); // save the channel first so it's there before inviter subscribes to it
          options.saved = true;
          this.gun.user(pub).get('chatLinks').get(linkId).get('encryptedSharedKey').on(async encrypted => {
            const sharedKey = await Gun.SEA.decrypt(encrypted, sharedSecret);
            const encryptedChatRequest = await Gun.SEA.encrypt(this.key.pub, sharedSecret); // TODO encrypt is not deterministic, it uses salt
            const channelRequestId = await util.getHash(encryptedChatRequest);
            util.gunAsAnotherUser(this.gun, sharedKey, user => {
              user.get('chatRequests').get(channelRequestId.slice(0, 12)).put(encryptedChatRequest);
            });
          });
        }
      }
    }
  }

  getTheirSecretUuid(pub) {
    return new Promise(resolve => {
      if (!this.theirSecretUuids[pub]) {
        this.onTheirDirect(this.uuid, s => {
          this.theirSecretUuids[pub] = s;
          resolve(this.theirSecretUuids[pub]);
        }, pub);
      } else {
        resolve(this.theirSecretUuids[pub]);
      }
    });
  }

  getTheirGroupSecret(pub) {
    if (pub === this.key.pub) { return this.getMyGroupSecret(); }
    return new Promise(resolve => {
      if (!this.theirGroupSecrets[pub]) {
        this.onTheirDirect(`S${this.uuid}`, s => {
          this.theirGroupSecrets[pub] = s;
          resolve(this.theirGroupSecrets[pub]);
        }, pub);
      } else {
        resolve(this.theirGroupSecrets[pub]);
      }
    });
  }

  changeMyGroupSecret() {
    this.myGroupSecret = Gun.SEA.random(32).toString('base64');
    // TODO: secret should be archived and probably messages should include the encryption key id so past messages don't become unreadable
    this.putDirect(`S${this.uuid}`, this.myGroupSecret);
  }

  /**
  * Unsubscribe messages from a channel participants
  *
  * @param {string} participant public key
  */
  async mute(participant) {
    this.gun.user(participant).get(this.theirSecretUuids[participant]).off();
    // TODO: persist
  }

  /**
  * Mute user and prevent them from seeing your further (and maybe past) messages
  *
  * @param {string} participant public key
  */
  async block(participant) {
    this.mute(participant);
    this.putDirect(this.uuid, null);
    this.putDirect(`S${this.uuid}`, null);
    delete this.secrets[participant];
    delete this.ourSecretChannelIds[participant];
    delete this.theirSecretChannelIds[participant];
    this.changeMyGroupSecret();
  }

  async getMySecretUuid() {
    if (!this.mySecretUuid) {
      const mySecret = await Gun.SEA.secret(this.key.epub, this.key);
      const mySecretHash = await util.getHash(mySecret);
      this.mySecretUuid = await util.getHash(mySecretHash + this.uuid);
    }
    return this.mySecretUuid;
  }

  /**
  * List participants of the channel (other than you)
  */
  getCurrentParticipants() {
    return Object.keys(this.secrets);
  }

  /**
  * Subscribe to the changing list of participants by channel admins
  */
  getParticipants(callback) {
    if (this.getParticipantsCallbackId) {
      this.getParticipantsCallbackId++;
    } else {
      this.getParticipantsCallbackId = 1;
    }
    this.getParticipantsCallbacks[this.getParticipantsCallbackId] = callback;
    if (this.participants) {
      callback(this.participants);
    }
  }

  participantsChanged() {
    Object.keys(this.getParticipantsCallbacks).forEach(id => {
      this.getParticipantsCallbacks[id](this.participants);
    });
  }

  /**
  * Returns either the uuid of a group channel or the public key of a direct channel.
  */
  getId() {
    return this.uuid || this.getCurrentParticipants()[0];
  }

  async getSecret(pub) {
    if (!this.secrets[pub]) {
      const epub = await util.gunOnceDefined(this.gun.user(pub).get(`epub`));
      this.secrets[pub] = await Gun.SEA.secret(epub, this.key);
    }
    return this.secrets[pub];
  }

  /**
  *
  */
  static async getOurSecretChannelId(gun, pub, pair) {
    const epub = await util.gunOnceDefined(gun.user(pub).get(`epub`));
    const secret = await Gun.SEA.secret(epub, pair);
    return util.getHash(secret + pub);
  }

  /**
  *
  */
  static async getTheirSecretChannelId(gun, pub, pair) {
    const epub = await util.gunOnceDefined(gun.user(pub).get(`epub`));
    const secret = await Gun.SEA.secret(epub, pair);
    return util.getHash(secret + pair.pub);
  }

  /**
  * Calls back with Channels that you have initiated or written to.
  * @param {Object} gun user.authed gun instance
  * @param {Object} keypair Gun.SEA keypair that the gun instance is authenticated with
  * @param callback callback function that is called for each public key you have a channel with
  */
  static async getChannels(gun, keypair, callback, listenToChatLinks = true) {
    const mySecret = await Gun.SEA.secret(keypair.epub, keypair);
    if (listenToChatLinks) {
      Channel.getMyChatLinks(gun, keypair, undefined, undefined, true);
    }
    const seen = {};
    gun.user().get(`chats`).map().on(async (value, ourSecretChannelId) => {
      if (value && !seen[ourSecretChannelId]) {
        seen[ourSecretChannelId] = true;
        if (ourSecretChannelId.length > 44) {
          gun.user().get(`chats`).get(ourSecretChannelId).put(null);
          return;
        }
        const encryptedChatId = await util.gunOnceDefined(gun.user().get(`chats`).get(ourSecretChannelId).get(`pub`));
        const chatId = await Gun.SEA.decrypt(encryptedChatId, mySecret);
        if (!chatId) {
          return;
        }
        if (chatId.pub || typeof chatId === `string`) {
          callback(new Channel({
            key: keypair,
            gun,
            participants: chatId.pub || chatId,
            save: false
          }));
        } else if (chatId.uuid && chatId.participants && chatId.myGroupSecret) {
          callback(new Channel({
            key: keypair,
            gun,
            participants: chatId.participants,
            uuid: chatId.uuid,
            myGroupSecret: chatId.myGroupSecret,
            save: false
          }));
        }
      }
    });
  }

  getMyGroupSecret() { // group secret could be deterministic: hash(encryptToSelf(uuid + iterator))
    if (!this.myGroupSecret) {
      this.changeMyGroupSecret();
    }
    return this.myGroupSecret;
  }

  async getOurSecretChannelId(pub) {
    if (!this.ourSecretChannelIds[pub]) {
      const secret = await this.getSecret(pub);
      this.ourSecretChannelIds[pub] = await util.getHash(secret + pub);
    }
    return this.ourSecretChannelIds[pub];
  }

  async getTheirSecretChannelId(pub) {
    if (!this.theirSecretChannelIds[pub]) {
      const secret = await this.getSecret(pub);
      this.theirSecretChannelIds[pub] = await util.getHash(secret + this.key.pub);
    }
    return this.theirSecretChannelIds[pub];
  }

  /**
  * Get messages from the channel
  */
  async getMessages(callback) { // TODO: save callback and apply it when new participants are added to channel
    this.getCurrentParticipants().forEach(async pub => {
      if (pub !== this.key.pub) {
        // Subscribe to their messages
        let theirSecretChannelId;
        if (this.uuid) {
          theirSecretChannelId = await this.getTheirSecretUuid(pub);
        } else {
          theirSecretChannelId = await this.getTheirSecretChannelId(pub);
        }
        this.gun.user(pub).get(`chats`).get(theirSecretChannelId).get(`msgs`).map().once((data, key) => {this.messageReceived(callback, data, this.uuid || pub, false, key, pub);});
      }
      if (!this.uuid) {
        // Subscribe to our messages
        const ourSecretChannelId = await this.getOurSecretChannelId(pub);
        this.user.get(`chats`).get(ourSecretChannelId).get(`msgs`).map().once((data, key) => {this.messageReceived(callback, data, pub, true, key, this.key.pub);});
      }
    });
    if (this.uuid) {
      // Subscribe to our messages
      const mySecretUuid = await this.getMySecretUuid();
      this.user.get(`chats`).get(mySecretUuid).get(`msgs`).map().once((data, key) => {this.messageReceived(callback, data, this.uuid, true, key, this.key.pub);});
    }
  }

  async messageReceived(callback, data, channelId, selfAuthored, key, from) {
    if (this.messages[key] || !data) {
      return;
    }
    const secret = this.uuid ? (await this.getTheirGroupSecret(from)) : (await this.getSecret(channelId));
    const decrypted = await Gun.SEA.decrypt(data, secret);
    if (typeof decrypted !== `object`) {
      return;
    }
    const info = {selfAuthored, channelId, from};
    this.messages[key] = decrypted;
    callback(decrypted, info);
  }

  /**
  * Get latest message in this channel. Useful for channel listing.
  */
  async getLatestMsg(callback) {
    const callbackIfLatest = async (msg, info) => {
      if (!this.latest) {
        this.latest = msg;
        callback(msg, info);
      } else {
        const t = (typeof this.latest.time === `string` ? this.latest.time : this.latest.time.toISOString());
        if (t < msg.time) {
          this.latest = msg;
          callback(msg, info);
        }
      }
    };
    this.onMy('latestMsg', msg => callbackIfLatest(msg, {selfAuthored: true, from: this.key.pub}));
    this.onTheir('latestMsg', (msg, k, from) => callbackIfLatest(msg, {selfAuthored: false, from}));
  }

  /**
  * Useful for notifications
  * @param {integer} time last seen msg time (default: now)
  */
  async setMyMsgsLastSeenTime(time) {
    time = time || new Date().toISOString();
    return this.put(`msgsLastSeenTime`, time);
  }

  /**
  * Useful for notifications
  */
  async getMyMsgsLastSeenTime(callback) {
    this.onMy(`msgsLastSeenTime`, time => {
      this.myMsgsLastSeenTime = time;
      if (callback) {
        callback(this.myMsgsLastSeenTime);
      }
    });
  }

  /**
  * For "seen" status indicator
  */
  async getTheirMsgsLastSeenTime(callback) {
    this.onTheir(`msgsLastSeenTime`, time => {
      this.theirMsgsLastSeenTime = time;
      if (callback) {
        callback(this.theirMsgsLastSeenTime);
      }
    });
  }

  async removeParticipant(pub) {
    this.addParticipant(pub, true, {read: false, write: false});
  }

  /**
  * Add a public key to the channel or update its permissions
  * @param {string} pub
  */
  async addParticipant(pub, save = true, permissions, subscribe) {
    if (permissions === undefined) {
      permissions = this.DEFAULT_PERMISSIONS;
    }
    if (this.secrets[pub] && JSON.stringify(this.secrets[pub]) === JSON.stringify(permissions)) { // TODO: should be this.participants[pub]
      return;
    }
    this.secrets[pub] = null;
    this.getSecret(pub);
    const ourSecretChannelId = await this.getOurSecretChannelId(pub);
    if (save) {
      // Save their public key in encrypted format, so in channel listing we know who we are channeling with
      const mySecret = await Gun.SEA.secret(this.key.epub, this.key);
      this.gun.user().get(`chats`).get(ourSecretChannelId).get(`pub`).put(await Gun.SEA.encrypt({pub}, mySecret));
    }
    if (this.uuid) {
      this.participants[pub] = permissions;
      if (save) {
        this.putDirect(`S${this.uuid}`, this.getMyGroupSecret());
        this.getMySecretUuid().then(s => {
          this.putDirect(this.uuid, s); // TODO: encrypt keys in put()
        });
        this.onTheirDirect(this.uuid, (s, k, from) => {
          this.theirSecretUuids[from] = s;
        });
        this.onTheirDirect(`S${this.uuid}`, (s, k, from) => {
          this.theirGroupSecrets[from] = s;
        });
        this.save();
      }
    }
    if (subscribe) {
      Object.values(this.directSubscriptions).forEach(arr => {
        arr.forEach(o => {
          if (!o.from || o.from === pub) {
            this._onTheirDirectFromUser(pub, o.key, o.callback);
          }
        });
      });
      Object.values(this.groupSubscriptions).forEach(arr => {
        arr.forEach(o => {
          if (o.from && o.from !== pub) { return; }
          if (permissions.write) {
            this._onTheirGroupFromUser(pub, o.key, o.callback);
          } else {  // unsubscribe
            o.event && o.event.off();
          }
        });
      });
    }
  }

  /**
  * Send a message to the channel
  * @param msg string or {time, text, ...} object
  */
  async send(msg) {
    if (typeof msg === `string`) {
      msg = msg.trim();
      if (msg.length === 0) {
        return;
      }
      msg = {
        time: (new Date()).toISOString(),
        text: msg
      };
    } else if (typeof msg === `object`) {
      msg.time = msg.time || (new Date()).toISOString();
    } else {
      throw new Error(`msg param must be a string or an object`);
    }
    //this.gun.user().get('message').set(temp);
    if (this.uuid) {
      const encrypted = await Gun.SEA.encrypt(JSON.stringify(msg), this.getMyGroupSecret());
      const mySecretUuid = await this.getMySecretUuid();
      this.user.get(`chats`).get(mySecretUuid).get(`msgs`).get(`${msg.time}`).put(encrypted);
      this.user.get(`chats`).get(mySecretUuid).get(`latestMsg`).put(encrypted);
    } else {
      const keys = this.getCurrentParticipants();
      for (let i = 0;i < keys.length;i++) {
        const encrypted = await Gun.SEA.encrypt(JSON.stringify(msg), (await this.getSecret(keys[i])));
        const ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
        this.user.get(`chats`).get(ourSecretChannelId).get(`msgs`).get(`${msg.time}`).put(encrypted);
        this.user.get(`chats`).get(ourSecretChannelId).get(`latestMsg`).put(encrypted);
      }
    }
  }

  /**
  * Save the channel to our channels list without sending a message
  */
  async save() {
    if (this.uuid) {
      const mySecretUuid = await this.getMySecretUuid();
      this.user.get(`chats`).get(mySecretUuid).get('msgs').get('a').put(null);
      this.put(`participants`, this.participants); // public participants list
      const mySecret = await Gun.SEA.secret(this.key.epub, this.key);
      this.user.get(`chats`).get(mySecretUuid).get(`pub`).put(await Gun.SEA.encrypt({
        uuid: this.uuid,
        myGroupSecret: this.getMyGroupSecret(),
        participants: this.participants // private participants list
      }, mySecret));
      this.participantsChanged();
    } else {
      const keys = this.getCurrentParticipants();
      for (let i = 0;i < keys.length;i++) {
        const ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
        this.user.get(`chats`).get(ourSecretChannelId).get('msgs').get('a').put(null);
      }
    }
  }

  /**
  * Save a key-value pair, encrypt value. Each participant in the Channel writes to their own version of the key-value pair — they don't overwrite the same one.
  * @param {string} key
  * @param value
  */
  async put(key, value) {
    return (this.uuid ? this.putGroup : this.putDirect).call(this, key, value);
  }

  async putGroup(key, value) {
    if (key === `msgs`) { throw new Error(`Sorry, you can't overwrite the msgs field which is used for .send()`); }
    const encrypted = await Gun.SEA.encrypt(JSON.stringify(value), this.getMyGroupSecret());
    const mySecretUuid = await this.getMySecretUuid();
    this.user.get(`chats`).get(mySecretUuid).get(key).put(encrypted);
  }

  async putDirect(key, value) {
    if (key === `msgs`) { throw new Error(`Sorry, you can't overwrite the msgs field which is used for .send()`); }
    const keys = this.getCurrentParticipants();
    for (let i = 0;i < keys.length;i++) {
      const encrypted = await Gun.SEA.encrypt(JSON.stringify(value), (await this.getSecret(keys[i])));
      const ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
      this.user.get(`chats`).get(ourSecretChannelId).get(key).put(encrypted);
    }
  }

  /**
  * Subscribe to a key-value pair. Callback returns every participant's value unless you limit it with *from* param.
  * @param {string} key
  * @param {function} callback
  * @param {string} from public key whose value you want, or *"me"* for your value only, or *"them"* for the value of others only
  */
  async on(key, callback, from) {
    return (this.uuid ? this.onGroup : this.onDirect).call(this, key, callback, from);
  }

  async onDirect(key, callback, from) {
    if (!from || from === `me` || from === this.key.pub) {
      this.onMy(key, val => callback(val, this.key.pub));
    }
    if (!from || (from !== `me` && from !== this.key.pub)) {
      this.onTheir(key, (val, k, pub) => callback(val, pub));
    }
  }

  async onGroup(key, callback, from) {
    if (!from || from === `me` || from === this.key.pub) {
      this.onMyGroup(key, val => callback(val, this.key.pub));
    }
    if (!from || (from !== `me` && from !== this.key.pub)) {
      this.onTheirGroup(key, (val, k, pub) => callback(val, pub));
    }
  }

  async onMy(key, callback) {
    return (this.uuid ? this.onMyGroup : this.onMyDirect).call(this, key, callback);
  }

  async onMyDirect(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`onMy callback must be a function, got ${typeof callback}`);
    }
    const keys = this.getCurrentParticipants();
    for (let i = 0;i < keys.length;i++) {
      const ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
      this.gun.user().get(`chats`).get(ourSecretChannelId).get(key).on(async data => {
        const decrypted = await Gun.SEA.decrypt(data, (await this.getSecret(keys[i])));
        if (decrypted) {
          callback(typeof decrypted.v !== `undefined` ? decrypted.v : decrypted, key);
        }
      });
      break;
    }
  }

  async onMyGroup(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`onMy callback must be a function, got ${typeof callback}`);
    }
    const mySecretUuid = await this.getMySecretUuid();
    const mySecret = await this.getMyGroupSecret();
    this.gun.user().get(`chats`).get(mySecretUuid).get(key).on(async data => {
      const decrypted = await Gun.SEA.decrypt(data, mySecret);
      if (decrypted) {
        callback(typeof decrypted.v !== `undefined` ? decrypted.v : decrypted, key, this.key.pub);
      }
    });
  }

  async onTheir(key, callback, from) {
    return (this.uuid ? this.onTheirGroup : this.onTheirDirect).call(this, key, callback, from);
  }

  async _onTheirDirectFromUser(pub, key, callback) {
    if (!this.hasWritePermission(pub)) { return; }
    const theirSecretChannelId = await this.getTheirSecretChannelId(pub);
    this.gun.user(pub).get(`chats`).get(theirSecretChannelId).get(key).on(async data => {
      if (!this.hasWritePermission(pub)) { return; }
      const decrypted = await Gun.SEA.decrypt(data, (await this.getSecret(pub)));
      if (decrypted) {
        callback(typeof decrypted.v !== `undefined` ? decrypted.v : decrypted, key, pub);
      }
    });
  }

  async onTheirDirect(key, callback, from) {  // TODO: subscribe to new channel participants
    if (typeof callback !== 'function') {
      throw new Error(`onTheir callback must be a function, got ${typeof callback}`);
    }
    if (!Object.prototype.hasOwnProperty.call(this.directSubscriptions, key)) {
      this.directSubscriptions[key] = [];
    }
    this.directSubscriptions[key].push({key, callback, from});
    const participants = this.getCurrentParticipants();
    participants.forEach(async pub => {
      if (from && pub !== from) { return; }
      this._onTheirDirectFromUser(pub, key, callback);
    });
  }

  hasWritePermission(pub) {
    return !this.uuid || (this.participants && this.participants[pub] && this.participants[pub].write);
  }

  async _onTheirGroupFromUser(pub, key, callback, subscription) {
    if (!this.hasWritePermission(pub)) { return; }
    const theirSecretUuid = await this.getTheirSecretUuid(pub);
    this.gun.user(pub).get(`chats`).get(theirSecretUuid).get(key).on(async (data, a, b, e) => {
      if (subscription) { subscription.event = e; }
      if (!this.hasWritePermission(pub)) { return; }
      const decrypted = await Gun.SEA.decrypt(data, (await this.getTheirGroupSecret(pub)));
      if (decrypted) {
        callback(typeof decrypted.v !== `undefined` ? decrypted.v : decrypted, key, pub);
      }
    });
  }

  async onTheirGroup(key, callback, from) {
    if (typeof callback !== 'function') {
      throw new Error(`onTheir callback must be a function, got ${typeof callback}`);
    }
    if (!Object.prototype.hasOwnProperty.call(this.groupSubscriptions, key)) {
      this.groupSubscriptions[key] = [];
    }
    const subscription = {key, callback, from};
    this.groupSubscriptions[key].push(subscription);

    this.getParticipants(participants => {
      Object.keys(participants).forEach(async pub => {
        if (from && pub !== from) { return; }
        if (!(participants[pub] && participants[pub].write)) { return; }
        this._onTheirGroupFromUser(pub, key, callback, subscription);
      });
    });
  }

  /**
  * Set typing status
  */
  setTyping(isTyping, timeout = 5) {
    isTyping = typeof isTyping === `undefined` ? true : isTyping;
    timeout = timeout * 1000;
    this.put(`typing`, isTyping ? new Date().toISOString() : new Date(0).toISOString());
    clearTimeout(this.setTypingTimeout);
    this.setTypingTimeout = setTimeout(() => this.put(`typing`, false), timeout);
  }

  /**
  * Get typing status
  */
  getTyping(callback, timeout = 5) { // TODO callback not called on setTyping(false), at least for self chat
    timeout = timeout * 1000;
    this.onTheir(`typing`, (typing, key, pub) => {
      if (callback) {
        const isTyping = typing && new Date() - new Date(typing) <= timeout;
        callback(isTyping, pub);
        this.getTypingTimeouts = this.getTypingTimeouts || {};
        clearTimeout(this.getTypingTimeouts[pub]);
        if (isTyping) {
          this.getTypingTimeouts[pub] = setTimeout(() => callback(false, pub), timeout);
        }
      }
    });
  }

  /**
  * Add a chat button to page
  * @param options {label, channelOptions}
  */
  static addChatButton(options = {}) {
    options = Object.assign({label: 'Chat'}, options);
    if (!options.channelOptions) {
      throw new Error('addChatButton missing options.channelOptions param');
    }
    util.injectCss();
    let channel, box;
    const btn = util.createElement('div', 'iris-chat-open-button', document.body);
    btn.setAttribute('id', 'iris-chat-open-button');
    btn.innerHTML = `<svg style="margin-right:7px;margin-bottom: -0.2em" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 510 510" xml:space="preserve"><path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"></path></svg> ${options.label}`;
    btn.addEventListener('click', () => {
      btn.setAttribute('style', 'display: none');
      if (!channel) {
        channel = new Channel(options.channelOptions);
        box = channel.getChatBox();
        document.body.appendChild(box);
      } else {
        box.setAttribute('style', ''); // show
      }
    });
  }

  /**
  * Get a simple link that points to the channel.
  *
  * Direct channel: both users need to give their simple links. Use createChatLink() to get a two-way link that needs to be given by one user only.
  *
  * Group channel: Works only if the link recipient has been already added onto the channel participants list.
  */
  getSimpleLink(urlRoot = 'https://iris.to/') {
    if (this.uuid) {
      return `${urlRoot}?channelId=${this.uuid}&inviter=${this.key.pub}`;
    }
    return `${urlRoot}?chatWith=${this.getCurrentParticipants()[0]}`;
  }

  /**
  *
  */
  async getChatLinks({callback, urlRoot, subscribe}) {
    urlRoot = urlRoot || 'https://iris.to/';
    if (!this.uuid) { throw new Error('Only group channels may have chat links'); }
    const chatLinks = [];
    const chatLinkSubscriptions = {};
    this.on('chatLinks', (links, from) => {
      // TODO: check admin permissions
      if (!links || typeof links !== 'object') { return; }
      Object.keys(links).forEach(linkId => {
        const link = links[linkId];
        if (link === null) {
          chatLinkSubscriptions[linkId] && chatLinkSubscriptions[linkId].off(); // unsubscribe removed chat link
          delete chatLinkSubscriptions[linkId];
          callback && callback({id: linkId, url: null});
          return;
        }
        if (chatLinks.indexOf(linkId) !== -1) { return; }
        const channels = [];
        chatLinks.push(linkId);
        const url = Channel.formatChatLink({urlRoot, inviter: from, channelId: this.uuid, sharedSecret: link.sharedSecret, linkId});
        callback && callback({url, id: linkId});
        if (subscribe) {
          this.gun.user(link.sharedKey.pub).get('chatRequests').map().on(async (encPub, requestId, a, e) => {
            if (!encPub || typeof encPub !== 'string' || encPub.length < 10) { return; }
            chatLinkSubscriptions[linkId] = e;
            const s = JSON.stringify(encPub);
            if (channels.indexOf(s) === -1) {
              channels.push(s);
              const pub = await Gun.SEA.decrypt(encPub, link.sharedSecret);
              this.addParticipant(pub, undefined, undefined, true);
            }
          });
        }
      });
    });
  }

  async createChatLink(urlRoot = 'https://iris.to/') {
    const sharedKey = await Gun.SEA.pair();
    const sharedKeyString = JSON.stringify(sharedKey);
    const sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
    const encryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, sharedSecret);
    const ownerSecret = await Gun.SEA.secret(this.key.epub, this.key);
    const ownerEncryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, ownerSecret);
    let linkId = await util.getHash(encryptedSharedKey);
    linkId = linkId.slice(0, 12);

    // User has to exist, in order for .get(chatRequests).on() to be ever triggered
    await util.gunAsAnotherUser(this.gun, sharedKey, user => {
      return user.get('chatRequests').put({a: 1}).then();
    });

    this.chatLinks[linkId] = {sharedKey, sharedSecret};
    this.put('chatLinks', this.chatLinks);
    this.user.get('chatLinks').get(linkId).put({encryptedSharedKey, ownerEncryptedSharedKey});

    return Channel.formatChatLink({urlRoot, channelId: this.uuid, inviter: this.key.pub, sharedSecret, linkId});
  }

  /**
  * Get a channel box element that you can add to your page
  */
  getChatBox() {
    util.injectCss();
    let minimized = false;

    const chatBox = util.createElement('div', 'iris-chat-box');
    const header = util.createElement('div', 'iris-chat-header', chatBox);
    const minimize = util.createElement('span', 'iris-chat-minimize', header);
    minimize.innerText = '—';
    minimize.addEventListener('click', e => {
      e.stopPropagation();
      chatBox.setAttribute('class', 'iris-chat-box minimized');
      minimized = true;
    });
    const headerText = util.createElement('div', 'iris-chat-header-text', header);
    const onlineIndicator = util.createElement('span', 'iris-online-indicator', headerText);
    onlineIndicator.innerHTML = '&#x25cf;';
    const nameEl = util.createElement('span', undefined, headerText);
    const close = util.createElement('span', 'iris-chat-close', header);
    close.innerHTML = '&#215;';
    close.addEventListener('click', () => {
      chatBox.setAttribute('style', 'display: none');
      const openChatBtn = document.getElementById('iris-chat-open-button');
      if (openChatBtn) {
        openChatBtn.setAttribute('style', ''); // show
      }
    });
    header.addEventListener('click', () => {
      if (minimized) {
        chatBox.setAttribute('class', 'iris-chat-box');
        minimized = false;
      }
    });

    const messages = util.createElement('div', 'iris-chat-messages', chatBox);

    const typingIndicator = util.createElement('div', 'iris-typing-indicator', chatBox);
    typingIndicator.innerText = 'typing...';
    this.getTyping(isTyping => {
      typingIndicator.setAttribute('class', `iris-typing-indicator${  isTyping ? ' yes' : ''}`);
    });

    const inputWrapper = util.createElement('div', 'iris-chat-input-wrapper', chatBox);
    const textArea = util.createElement('textarea', undefined, inputWrapper);
    textArea.setAttribute('rows', '1');
    textArea.setAttribute('placeholder', 'Type a message');
    if (util.isMobile) {
      const sendBtn = util.createElement('button', undefined, inputWrapper);
      sendBtn.innerHTML = `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>
      `;
      sendBtn.addEventListener('click', () => {
        this.send(textArea.value);
        textArea.value = '';
        this.setTyping(false);
      });
    }

    const participants = this.getCurrentParticipants();
    if (participants.length) {
      const pub = participants[0];
      this.gun.user(pub).get('profile').get('name').on(name => nameEl.innerText = name);
      Channel.getActivity(this.gun, pub, status => {
        const cls = `iris-online-indicator${  status.isActive ? ' yes' : ''}`;
        onlineIndicator.setAttribute('class', cls);
        const undelivered = messages.querySelectorAll('.iris-chat-message:not(.delivered)');
        undelivered.forEach(msg => {
          if (msg.getAttribute('data-time') <= status.lastActive) {
            const c = msg.getAttribute('class');
            msg.setAttribute('class', `${c  } delivered`);
          }
        });
      });
    }

    this.getTheirMsgsLastSeenTime(time => {
      const unseen = messages.querySelectorAll('.iris-seen:not(.yes)');
      unseen.forEach(indicator => {
        const msgEl = indicator.parentElement.parentElement.parentElement;
        if (msgEl.getAttribute('data-time') <= time) {
          const msgClass = msgEl.getAttribute('class');
          if (msgClass.indexOf('delivered') === -1) {
            msgEl.setAttribute('class', `${msgClass  } delivered`);
          }
          indicator.setAttribute('class', 'iris-seen yes');
        }
      });
    });

    this.getMessages((msg, info) => {
      const msgContent = util.createElement('div', 'iris-msg-content');
      msgContent.innerText = msg.text;
      const time = util.createElement('div', 'time', msgContent);
      time.innerText = util.formatTime(new Date(msg.time));
      if (info.selfAuthored) {
        const cls = this.theirMsgsLastSeenTime >= msg.time ? 'iris-seen yes' : 'iris-seen';
        const seenIndicator = util.createElement('span', cls, time);
        seenIndicator.innerHTML = ' <svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg>';
      }
      msgContent.innerHTML = msgContent.innerHTML.replace(/\n/g, '<br>\n');

      const msgEl = util.createElement('div', `${info.selfAuthored ? 'our' : 'their'} iris-chat-message`);
      msgEl.appendChild(msgContent);
      msgEl.setAttribute('data-time', msg.time);
      for (let i = messages.children.length; i >= 0; i--) {
        if (i === 0) {
          messages.insertBefore(msgEl, messages.firstChild);
        } else {
          const t = messages.children[i - 1].getAttribute('data-time');
          if (t && t < msg.time) {
            messages.children[i - 1].insertAdjacentElement('afterend', msgEl);
            break;
          }
        }
      }
      messages.scrollTop = messages.scrollHeight;
    });

    textArea.addEventListener('keyup', event => {
      Channel.setActivity(this.gun, true); // TODO
      this.setMyMsgsLastSeenTime(); // TODO
      if (event.keyCode === 13) {
        event.preventDefault();
        const content = textArea.value;
        const caret = util.getCaret(textArea);
        if (event.shiftKey) {
          textArea.value = `${content.substring(0, caret - 1)  }\n${  content.substring(caret, content.length)}`;
        } else {
          textArea.value = content.substring(0, caret - 1) + content.substring(caret, content.length);
          this.send(textArea.value);
          textArea.value = '';
          this.setTyping(false);
        }
      } else {
        this.setTyping(!!textArea.value.length);
      }
    });

    return chatBox;
  }

  /**
  * Set the user's online/active status
  * @param {object} gun
  * @param {string} activity string: set the activity status every 3 seconds, null/false: stop updating
  */
  static setActivity(gun, activity) {
    if (gun.irisActivityStatus === activity) { return; }
    gun.irisActivityStatus = activity;
    clearTimeout(gun.setActivityTimeout);
    const update = () => {
      gun.user().get(`activity`).put({status: activity, time: new Date(Gun.state()).toISOString()});
    };
    update();
    function timerUpdate() {
      update();
      gun.setActivityTimeout = setTimeout(timerUpdate, 3000);
    }
    if (activity) {
      timerUpdate();
    }
  }

  /**
  * Get the online status of a user.
  *
  * @param {object} gun
  * @param {string} pubKey public key of the user
  * @param {boolean} callback receives a boolean each time the user's online status changes
  */
  static getActivity(gun, pubKey, callback) {
    let timeout;
    gun.user(pubKey).get(`activity`).on(activity => {
      if (!activity || !(activity.time && activity.status)) { return; }
      clearTimeout(timeout);
      const now = new Date(Gun.state());
      const activityDate = new Date(activity.time);
      const isActive = activityDate > new Date(now.getTime() - 10 * 1000) && activityDate < new Date(now.getTime() + 30 * 1000);
      callback({isActive, lastActive: activity.time, status: activity.status});
      if (isActive) {
        timeout = setTimeout(() => callback({isOnline: false, lastActive: activity.time}), 10000);
      }
    });
  }

  /**
  * In order to receive messages from others, this method must be called for newly created
  * users that have not started a channel with an existing user yet.
  *
  * It saves the user's key.epub (public key for encryption) into their gun user space,
  * so others can find it and write encrypted messages to them.
  *
  * If you start a channel with an existing user, key.epub is saved automatically and you don't need
  * to call this method.
  */
  static initUser(gun, key) {
    const user = gun.user();
    user.auth(key);
    user.put({epub: key.epub});
  }

  static formatChatLink({urlRoot, chatWith, channelId, inviter, sharedSecret, linkId}) {
    const enc = encodeURIComponent;
    if (channelId && inviter) {
      return `${urlRoot}?channelId=${enc(channelId)}&inviter=${enc(inviter)}&s=${enc(sharedSecret)}&k=${enc(linkId)}`;
    }
    return `${urlRoot}?chatWith=${enc(chatWith)}&s=${enc(sharedSecret)}&k=${enc(linkId)}`;
  }

  /**
  * Creates a channel link that can be used for two-way communication, i.e. only one link needs to be exchanged.
  */
  static async createChatLink(gun, key, urlRoot = 'https://iris.to/') {
    const user = gun.user();
    user.auth(key);

    const sharedKey = await Gun.SEA.pair();
    const sharedKeyString = JSON.stringify(sharedKey);
    const sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
    const encryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, sharedSecret);
    const ownerSecret = await Gun.SEA.secret(key.epub, key);
    const ownerEncryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, ownerSecret);
    let linkId = await util.getHash(encryptedSharedKey);
    linkId = linkId.slice(0, 12);

    // User has to exist, in order for .get(chatRequests).on() to be ever triggered
    util.gunAsAnotherUser(gun, sharedKey, user => {
      user.get('chatRequests').put({a: 1});
    });

    console.log(3);

    user.get('chatLinks').get(linkId).put({encryptedSharedKey, ownerEncryptedSharedKey});

    return Channel.formatChatLink({urlRoot, chatWith: key.pub, sharedSecret, linkId});
  }

  /**
  *
  */
  static async getMyChatLinks(gun, key, urlRoot = 'https://iris.to/', callback, subscribe) {
    const user = gun.user();
    user.auth(key);
    const mySecret = await Gun.SEA.secret(key.epub, key);
    const chatLinks = [];
    user.get('chatLinks').map().on((data, linkId) => {
      if (!data || chatLinks.indexOf(linkId) !== -1) { return; }
      const channels = [];
      user.get('chatLinks').get(linkId).get('ownerEncryptedSharedKey').on(async enc => {
        if (!enc || chatLinks.indexOf(linkId) !== -1) { return; }
        chatLinks.push(linkId);
        const sharedKey = await Gun.SEA.decrypt(enc, mySecret);
        const sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
        const url = Channel.formatChatLink({urlRoot, chatWith: key.pub, sharedSecret, linkId});
        if (callback) {
          callback({url, id: linkId});
        }
        if (subscribe) {
          gun.user(sharedKey.pub).get('chatRequests').map().on(async (encPub, requestId) => {
            if (!encPub) { return; }
            const s = JSON.stringify(encPub);
            if (channels.indexOf(s) === -1) {
              channels.push(s);
              const pub = await Gun.SEA.decrypt(encPub, sharedSecret);
              const channel = new Channel({gun, key, participants: pub});
              channel.save();
            }
            util.gunAsAnotherUser(gun, sharedKey, user => { // remove the channel request after reading
              user.get('chatRequests').get(requestId).put(null);
            });
          });
        }
      });
    });
  }

  /**
  *
  */
  removeGroupChatLink(linkId) {
    this.chatLinks[linkId] = null;
    this.put('chatLinks', this.chatLinks);
    this.gun.user().get('chatLinks').get(linkId).put(null);
  }

  /**
  *
  */
  static removePrivateChatLink(gun, key, linkId) {
    gun.user().auth(key);
    gun.user().get('chatLinks').get(linkId).put(null);
  }

  /**
  *
  */
  static async deleteChannel(gun, key, pub) {
    gun.user().auth(key);
    const channelId = await Channel.getOurSecretChannelId(gun, pub, key);
    gun.user().get('channels').get(channelId).put(null);
    gun.user().get('channels').get(channelId).off();
  }
}

export default Channel;
