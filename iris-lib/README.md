# Iris-lib
> Decentralize everything.

Iris is a fully decentralized p2p database that you can use to build all kinds of decentralized applications.

* "Accounts" are just keypairs that can be created at will. No signup required.
* All data is stored offline-first, and synced with other peers.
* Publish-subscribe network and a callback system for real-time updates.
* Public and private (encrypted) data is supported.
* Make aggregate queries from your social network or other group. For example:
  - Fetch the latest 10 posts from your extended social network.
  - Fetch the latest posts from the users on list maintained by a moderator of your choice.
  - Fetch 3d objects in virtual room from your friends.
* Super simple API

## Installation

```sh
npm install iris-lib
or
yarn add iris-lib
```

```js
const iris = require('iris-lib');
```

or include the script in your html:

```html
<script src="https://unpkg.com/iris-lib"></script>
```

## Usage

Read/write public profiles:
```js
iris.public().get('profile').get('name').on((name) => {
  console.log('My name is', name);
});
iris.public().get('profile').get('name').set('John Doe');
iris.public('hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU').get('profile').get('name').on((name) => {
  console.log('Someone else\'s name is', name);
});
```

Make a public post and get posts from everyone in your social network:
```js
iris.session.init(); // Generate a new keypair and crawl the Iris social network using a default entry point.
iris.public().get('msgs').get(new Date().toISOString()).put({text: 'Hello world!'});
iris.group('everyone').map('msgs', (msg, from) => {
  console.log('msg from', from.slice(0,6), msg);
});
```

Private messaging, browser 1:
```js
const user1 = iris.session.getKey();
console.log('User 1 key:', user1);
iris.private(user2.pub).send('Hello, user 2!');
iris.private(user2.pub).getMessages(msg => {
  console.log('User 1 received a message:', msg);
});
```

Private messaging, browser 2:
```js
const user2 = iris.session.getKey();
console.log('User 2 key:', user2);
iris.private(user1.pub).send('Hello, user 1!');
iris.private(user1.pub).getMessages(msg => {
  console.log('User 2 received a message:', msg);
});
```