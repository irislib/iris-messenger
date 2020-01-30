# iris-messenger

Decentralized messenger! Just [iris-lib](https://github.com/irislib/iris-lib), [gun](https://github.com/amark/gun), jquery and some helpers.

Try it out: [iris.to](https://iris.to)

Or get the **desktop version** ([download](https://github.com/irislib/iris-electron/releases), [source code](https://github.com/irislib/iris-electron)):
* Communicate and synchronize with local network peers without Internet access
  * When local peers eventually connect to the Internet, your messages are relayed globally
  * Bluetooth support upcoming
* Opens to background on login: stay online and get message notifications!
* More secure and available: no need to open the browser application from a server.

## Develop
```
git clone git@github.com:irislib/iris-messenger.git
cd iris-messenger
yarn
yarn start
```

## Privacy
Messages are end-to-end encrypted, but message timestamps and the number of chats aren't.

By looking at timestamps in chats, it is possible to guess who are chatting with each other. It is also possible, if not trivial, to find out who are communicating with each other by monitoring data subscriptions on the decentralized database.

In that regard, Iris prioritizes decentralization and availability over perfect privacy.

Profile names, photos and online status are currently public. That can be changed when advanced group permissions are developed.
