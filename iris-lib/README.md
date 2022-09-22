# iris-lib

![Node](https://img.shields.io/node/v/iris-lib.svg?style=flat-square)
[![NPM](https://img.shields.io/npm/v/iris-lib.svg?style=flat-square)](https://www.npmjs.com/package/iris-lib)
[![Travis](https://img.shields.io/travis/irislib/iris-lib/master.svg?style=flat-square)](https://travis-ci.org/irislib/iris-lib)
[![David](https://img.shields.io/david/irislib/iris-lib.svg?style=flat-square)](https://david-dm.org/irislib/iris-lib)
[![Coverage Status](https://img.shields.io/coveralls/irislib/iris-lib.svg?style=flat-square)](https://coveralls.io/github/irislib/iris-lib)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

<a href="https://opencollective.com/iris-social/donate" target="_blank"><img src="https://opencollective.com/iris-social/donate/button@2x.png?color=blue" width=200 /></a>

<p><sub>BTC donations: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST</sub></p>

### Description
Iris-lib allows you to integrate __decentralized social networking__ features into your application.

Public messaging: Add a troll-free comment box to your website or app.

Private chats: Don't reinvent the wheel - just deploy iris-lib for real-time private and group discussions. No phone number or other "account" needed - just generate a public key that your friends can optionally verify.

Web of trust: Filter out spam and other unwanted content, without giving power to central moderators. Iris public and private messages are automatically filtered. You can also filter your own datasets by user's web of trust distance.

Contacts management: Ask friends to verify your public key or cryptocurrency address and changes to them. Use verified payment addresses in crypto wallets. Use verified public keys for authentication instead of relying on centralized email addresses, domain names and passwords. Any other types of attributes can also be added and verified.

Iris-lib runs in the browser and on Node.js.

### Documentation
* [Iris API](http://docs.iris.to/)
* [Web components](https://examples.iris.to/components/)

### Example

Private channel:
```js
// Copy & paste this to console at https://iris.to or other page that has gun, sea and iris-lib
// Due to an unsolved bug, someoneElse's messages only start showing up after a reload

var gun1 = new Gun('https://gun-us.herokuapp.com/gun');
var gun2 = new Gun('https://gun-us.herokuapp.com/gun');
var myKey = await iris.Key.getDefault();
var someoneElse = localStorage.getItem('someoneElsesKey');
if (someoneElse) {
 someoneElse = JSON.parse(someoneElse);
} else {
 someoneElse = await iris.Key.generate();
 localStorage.setItem('someoneElsesKey', JSON.stringify(someoneElse));
}

iris.Channel.initUser(gun1, myKey); // saves myKey.epub to gun.user().get('epub')
iris.Channel.initUser(gun2, someoneElse);

var ourChannel = new iris.Channel({key: myKey, gun: gun1, participants: someoneElse.pub});
var theirChannel = new iris.Channel({key: someoneElse, gun: gun2, participants: myKey.pub});

var myChannels = {}; // you can list them in a user interface
function printMessage(msg, info) {
 console.log(`[${new Date(msg.time).toLocaleString()}] ${info.from.slice(0,8)}: ${msg.text}`)
}
iris.Channel.getChannels(gun1, myKey, channel => {
 var pub = channel.getParticipants()[0];
 gun1.user(pub).get('profile').get('name').on(name => channel.name = name);
 myChannels[pub] = channel;
 channel.getMessages(printMessage);
 channel.on('mood', (mood, from) => console.log(from.slice(0,8) + ' is feeling ' + mood));
});

// you can play with these in the console:
ourChannel.send('message from myKey');
theirChannel.send('message from someoneElse');

ourChannel.put('mood', 'blessed');
theirChannel.put('mood', 'happy');
```

More examples: [tests](https://github.com/irislib/iris-lib/tree/master/__tests__)

### Tech
Data storage and networking are outsourced to [GUN](https://github.com/amark/gun), which manages the synchronization of data between different storages: RAM, localstorage, GUN websocket server, WebRTC peers, LAN multicast peers, IPFS (no adapter yet), S3 or others.

GUN enables subscription to data changes, so message feeds and contact details just update real-time without having to hit f5 or writing complex update logic.

IPFS is used to store file attachments and optional message backups.

### Installation

Install via [yarn](https://github.com/yarnpkg/yarn)

	yarn add iris-lib (--dev)

or npm

	npm install iris-lib (--save-dev)

### Builds

If you don't use a package manager, you can [access `iris-lib` via unpkg (CDN)](https://unpkg.com/iris-lib/), download the source, or point your package manager to the url.

`iris-lib` is compiled as a collection of [CommonJS](http://webpack.github.io/docs/commonjs.html) modules & [ES2015 modules](http://www.2ality.com/2014/09/es6-modules-final.html) for bundlers that support the `jsnext:main` or `module` field in package.json (Rollup, Webpack 2)

The `iris-lib` package includes precompiled production and development [UMD](https://github.com/umdjs/umd) builds in the [`dist` folder](https://unpkg.com/iris-lib/dist/). They can be used directly without a bundler and are thus compatible with many popular JavaScript module loaders and environments. You can drop a UMD build as a [`<script>` tag](https://unpkg.com/iris-lib) on your page. The UMD builds make `iris-lib` available as a `window.iris` global variable. Be sure to include [gun.js and sea.js](https://github.com/amark/gun) first.

```
<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gun/sea.js"></script>
<script src="https://cdn.jsdelivr.net/npm/iris-lib@latest/dist/iris.min.js"></script>
```

### License

The code is available under the [MIT](LICENSE) license.

### Contributing

Please do **integrate** iris-lib with your existing application or with a test application and **create Github issues** for the bugs and other problems you may encounter. Your help is much appreciated!

TODO list is also available on [Trello](https://trello.com/b/8qUutkmP/iris).

[Majestic](https://github.com/Raathigesh/majestic) is a handy tool for viewing jest test results and coverage.

### Misc

This module was created using [generator-module-boilerplate](https://github.com/duivvv/generator-module-boilerplate).
