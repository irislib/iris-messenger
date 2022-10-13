import 'gun/sea';
/**
* Private communication channel between two or more participants ([Gun](https://github.com/amark/gun) public keys). Can be used independently of other Iris stuff.
*
* Used as a core element of [iris-messenger](https://github.com/irislib/iris-messenger).
*
* You can use iris.private(pub) to always use the same Channel object for a given pub.
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
declare class Channel {
    latestTime: any;
    theirMsgsLastSeenDate: any;
    myLastSeenTime: any;
    theirMsgsLastSeenTime: any;
    notificationSetting: any;
    messageIds: any;
    latest: any;
    uuid: any;
    name: any;
    theirSecretUuids: {};
    theirGroupSecrets: {};
    secrets: {};
    ourSecretChannelIds: {};
    theirSecretChannelIds: {};
    messages: {};
    chatLinks: {};
    groupSubscriptions: {};
    directSubscriptions: {};
    getParticipantsCallbacks: {};
    myGroupSecret: any;
    participants: any;
    constructor(options: any);
    useChatLink(options: any): void;
    getTheirSecretUuid(pub: any): Promise<unknown>;
    getTheirGroupSecret(pub: any): any;
    changeMyGroupSecret(): void;
    /**
    * Unsubscribe messages from a channel participants
    *
    * @param {string} participant public key
    */
    mute(participant: any): Promise<void>;
    /**
    * Mute user and prevent them from seeing your further (and maybe past) messages
    *
    * @param {string} participant public key
    */
    block(participant: any): Promise<void>;
    getMySecretUuid(): Promise<any>;
    /**
    * List participants of the channel (other than you)
    */
    getCurrentParticipants(): string[];
    /**
    * Subscribe to the changing list of participants by channel admins
    */
    getParticipants(callback: any): void;
    participantsChanged(): void;
    /**
    * Returns either the uuid of a group channel or the public key of a direct channel.
    */
    getId(): any;
    getSecret(pub: any): Promise<any>;
    /**
    *
    */
    static getOurSecretChannelId(pub: any, pair: any): Promise<any>;
    /**
    *
    */
    static getTheirSecretChannelId(pub: any, pair: any): Promise<any>;
    /**
    * Calls back with Channels that you have initiated or written to.
    * @param {Object} keypair Gun.SEA keypair that the gun instance is authenticated with
    * @param callback callback function that is called for each public key you have a channel with
    */
    static getChannels(callback: any, listenToChatLinks?: boolean): Promise<void>;
    getMyGroupSecret(): any;
    getOurSecretChannelId(pub: any): Promise<any>;
    getTheirSecretChannelId(pub: any): Promise<any>;
    /**
    * Get messages from the channel
    */
    getMessages(callback: any): Promise<void>;
    messageReceived(callback: any, data: any, channelId: any, selfAuthored: any, key: any, from: any): Promise<void>;
    /**
    * Get latest message in this channel. Useful for channel listing.
    */
    getLatestMsg(callback: any): Promise<void>;
    /**
    * Useful for notifications
    * @param {integer} time last seen msg time (default: now)
    */
    setMyMsgsLastSeenTime(time?: string): Promise<void>;
    /**
    * Useful for notifications
    */
    getMyMsgsLastSeenTime(callback: any): Promise<void>;
    /**
    * For "seen" status indicator
    */
    getTheirMsgsLastSeenTime(callback: any): Promise<void>;
    removeParticipant(pub: any): Promise<void>;
    /**
    * Add a public key to the channel or update its permissions
    * @param {string} pub
    */
    addParticipant(pub: string, save?: boolean, permissions?: any, subscribe?: boolean): Promise<void>;
    /**
    * Send a message to the channel
    * @param msg string or {time, text, ...} object
    */
    send(msg: any): Promise<void>;
    /**
    * Save the channel to our channels list without sending a message
    */
    save(): Promise<void>;
    /**
    * Save a key-value pair, encrypt value. Each participant in the Channel writes to their own version of the key-value pair — they don't overwrite the same one.
    * @param {string} key
    * @param value
    */
    put(key: any, value: any): Promise<void>;
    putGroup(key: any, value: any): Promise<void>;
    putDirect(key: any, value: any): Promise<void>;
    /**
    * Subscribe to a key-value pair. Callback returns every participant's value unless you limit it with *from* param.
    * @param {string} key
    * @param {function} callback
    * @param {string} from public key whose value you want, or *"me"* for your value only, or *"them"* for the value of others only
    */
    on(key: string, callback: Function, from?: string): Promise<void>;
    onDirect(key: string, callback: Function, from?: string): Promise<void>;
    onGroup(key: string, callback: Function, from?: string): Promise<void>;
    onMy(key: string, callback: Function): Promise<void>;
    onMyDirect(key: string, callback: Function): Promise<void>;
    onMyGroup(key: any, callback: any): Promise<void>;
    onTheir(key: string, callback: Function, from: string): Promise<void>;
    _onTheirDirectFromUser(key: string, callback: Function, pub: string): Promise<void>;
    onTheirDirect(key: string, callback: Function, from: string): Promise<void>;
    hasWritePermission(pub: any): any;
    _onTheirGroupFromUser(pub: string, key: string, callback: Function, subscription: any): Promise<void>;
    onTheirGroup(key: any, callback: any, from: any): Promise<void>;
    /**
    * Set typing status
    */
    setTyping(isTyping: any, timeout?: number): void;
    /**
    * Get typing status
    */
    getTyping(callback: any, timeout?: number): void;
    /**
    * Add a chat button to page
    * @param options {label, channelOptions}
    */
    static addChatButton(options?: {}): void;
    /**
    * Get a simple link that points to the channel.
    *
    * Direct channel: both users need to give their simple links. Use createChatLink() to get a two-way link that needs to be given by one user only.
    *
    * Group channel: Works only if the link recipient has been already added onto the channel participants list.
    */
    getSimpleLink(urlRoot?: string): string;
    /**
    *
    */
    getChatLinks(opts?: any): Promise<void>;
    createChatLink(urlRoot?: string): Promise<string>;
    /**
    * Get a channel box element that you can add to your page
    */
    getChatBox(): HTMLElement;
    /**
    * Set the user's online/active status
    * @param {string} activity string: set the activity status every 3 seconds, null/false: stop updating
    */
    static setActivity(activity: any): void;
    /**
    * Get the online status of a user.
    *
    * @param {string} pubKey public key of the user
    * @param {boolean} callback receives a boolean each time the user's online status changes
    */
    static getActivity(pubKey: any, callback: any): void;
    static formatChatLink({ urlRoot, chatWith, channelId, inviter, sharedSecret, linkId }: {
        urlRoot: any;
        chatWith: any;
        channelId: any;
        inviter: any;
        sharedSecret: any;
        linkId: any;
    }): string;
    /**
    * Creates a channel link that can be used for two-way communication, i.e. only one link needs to be exchanged.
    */
    static createChatLink(urlRoot?: string): Promise<string>;
    /**
    *
    */
    static getMyChatLinks(urlRoot: string | undefined, callback: Function, subscribe?: boolean): Promise<void>;
    /**
    *
    */
    removeGroupChatLink(linkId: any): void;
    /**
    *
    */
    static removePrivateChatLink(key: any, linkId: any): void;
    /**
    *
    */
    static deleteChannel(key: any, pub: any): Promise<void>;
    /**
    *
    */
    static deleteGroup(key: any, uuid: any): Promise<void>;
}
export default Channel;
