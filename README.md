![git_banner_1200x200](https://user-images.githubusercontent.com/52623440/226903633-7902aa21-6041-4bad-979a-dc98bd0ad317.png)
<div align="center">

[nostr](https://iris.to/iris) | [twitter](https://www.twitter.com/iristoapp) | [instagram](https://www.instagram.com/iristoapp) | [youtube](https://www.youtube.com/@iristoapp) | [linkedin](https://www.linkedin.com/company/91035282/) | [tiktok](https://www.tiktok.com/@iristoapp)

</div>


# Iris – The app for better social networks

[Iris](https://iris.to/) is a Nostr [Android](https://play.google.com/store/apps/details?id=to.iris.twa), [iOS](https://apps.apple.com/app/iris-the-nostr-client/id1665849007) and [web](https://iris.to/) client that has also standalone desktop ([Windows, MacOS, Linux](https://github.com/irislib/iris-messenger/releases)) and [Docker](#docker) versions.

- Sign up in seconds: Just type a name and hit "Go" 
- Secure: It's open source. Users can validate that big brother doesn't read your private messages.
- Available: It works offline-first and is not dependent on any single centrally managed server.

## Sign up, get started, FAQ and support

Visit [Iris FAQ](https://github.com/irislib/faq) for features, explanations and troubleshooting.

  https://user-images.githubusercontent.com/52623440/225862232-7ac9a16a-bf14-4745-ad48-3e3a67bc597e.mp4

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

[iris.to](https://iris.to) production version is in the [stable](https://github.com/irislib/iris-messenger/tree/stable) branch.

### Docker

Alternatively, you can run the dev environment on Docker: `docker-compose up`. The dev build with autoreload will be available at http://localhost:8080.

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

Tauri [desktop releases](https://github.com/irislib/iris-messenger/releases) are built from the `release` branch by GitHub CI.

## Privacy

The application is an unaudited proof-of-concept implementation, so don't use it for security critical purposes.

---

<a href="https://opencollective.com/iris-social/donate" target="_blank"><img src="https://opencollective.com/iris-social/donate/button@2x.png?color=blue" width=200 /></a>
