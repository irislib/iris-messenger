# Iris-lib
> Decentralize everything.

Iris is a fully decentralized p2p database that you can use to build all kinds of decentralized applications.

* "Accounts" are just key pairs that can be created at will. No signup required.
* Stores everything offline-first, and syncs with other users over a publish-subscribe network.
* Callback system for real-time updates.
* Supports public and private (encrypted) data.
* Make aggregate queries from your social network or other group. For example:
  - Fetch the latest posts from your extended social network.
  - Fetch the latest posts from the users on a list maintained by a moderator of your choice.
  - Fetch 3d objects in a virtual room from your friends.
* Super simple API

Used by [iris-messenger](https://iris.to) ([source](https://github.com/irislib/iris-messenger)), a decentralized social
networking application.
do
## Installation

```sh
npm install iris-lib
```

or

```sh
yarn add iris-lib
```

Import:
```js
import iris from 'iris-lib';
```

or include the script in your html:

```html
<script src="https://raw.githubusercontent.com/irislib/iris-messenger/master/iris-lib/dist/iris.umd.production.min.js"></script>
```

## Usage

Read/write public profiles:
```js
// Subscribe to your profile name
iris.public().get('profile').get('name').on((name) => {
  console.log('My name is', name);
});
// Set your profile name
iris.public().get('profile').get('name').put('John Doe');

// Subscribe to someone else's profile name
const pub = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU'; // Iris public key
iris.public(pub).get('profile').get('name').on((name) => {
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