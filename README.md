# Iris

Nostr client for better social networks.

- No phone number or signup required. Just type in your name or alias and go!
- Secure: It's open source. Users can validate that big brother doesn't read your private messages.
- Available: It works offline-first and is not dependent on any single centrally managed server.

## Use

Browser application: [iris.to](https://iris.to)

- No installation required
- Progressive web app
  - Use offline
  - Save as an app to home screen or desktop

## Develop

```bash
git clone https://github.com/irislib/iris-messenger.git
```

<details open><summary>Yarn</summary>

```bash
# install dependencies
yarn

# serve with hot reload at localhost:8080
yarn dev

# build for production with minification
yarn build

# test the production build locally
yarn serve

# run tests with jest and enzyme
yarn test
```

</details>
<details><summary>npm</summary>

```bash
# install dependencies
npm i

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# test the production build locally
npm run serve

# run tests with jest and enzyme
npm run test
```

</details>
<br/>
[iris.to](https://iris.to) production version is in the [stable](https://github.com/irislib/iris-messenger/tree/stable) branch.

### Tauri (desktop app)

[Tauri docs](https://tauri.app/v1/guides/)

<details open><summary>Yarn</summary>
```bash
# install dependencies
yarn

# develop
yarn tauri dev

# build
yarn tauri build
```
</details>
<details><summary>npm</summary>
```bash
# install dependencies
npm i

# develop
npm run tauri dev

# build
npm run tauri build
```
</details>

[iris.to](https://iris.to) production version is in the [production](https://github.com/irislib/iris-messenger/tree/production) branch.

Master branch is deployed to [beta.iris.to](https://beta.iris.to).

## Privacy

The application is an unaudited proof-of-concept implementation, so don't use it for security critical purposes.

## Contact

Join our [Telegram](https://t.me/irismessenger) (will be moved onto Iris when group chat is ready).

---

<a href="https://opencollective.com/iris-social/donate" target="_blank"><img src="https://opencollective.com/iris-social/donate/button@2x.png?color=blue" width=200 /></a>
