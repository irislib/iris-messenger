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

[iris.to](https://iris.to) production version is in the [production](https://github.com/irislib/iris-messenger/tree/production) branch.

#### Stack:
* [Vite](https://vitejs.dev/) — a fast frontend build tool
* [Preact](https://preactjs.com/) — a fast 3kB alternative to React with the same modern API
* [Tailwind CSS](https://tailwindcss.com/docs/installation) — a CSS framework for rapid UI development. Less custom CSS.
* [DaisyUI](https://daisyui.com/components/) — a component library for Tailwind CSS

### Docker

Alternatively, you can run the dev environment on Docker: `docker-compose up`. The dev build with autoreload will be available at http://localhost:8080. 

With [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [GitHub Desktop](https://desktop.github.com/) this is an easy way to get started with development. Just clone this repository and run `docker-compose up` in a terminal in its directory.

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

## NIPS implemented

- [x] [NIP-01: Basic protocol flow description](https://github.com/nostr-protocol/nips/blob/master/01.md)<br>
- [x] [NIP-02: Contact List and Petnames](https://github.com/nostr-protocol/nips/blob/master/02.md)<br>
- [ ] [NIP-03: OpenTimestamps Attestations for Events](https://github.com/nostr-protocol/nips/blob/master/03.md)<br>
- [x] [NIP-04: Encrypted Direct Message](https://github.com/nostr-protocol/nips/blob/master/04.md)<br>
- [x] [NIP-05: Mapping Nostr keys to DNS-based internet identifiers](https://github.com/nostr-protocol/nips/blob/master/05.md)<br>
- [ ] [NIP-06: Basic key derivation from mnemonic seed phrase](https://github.com/nostr-protocol/nips/blob/master/06.md)<br>
- [x] [NIP-07: `window.nostr` capability for web browsers](https://github.com/nostr-protocol/nips/blob/master/07.md)<br>
- [x] [NIP-08: Handling Mentions](https://github.com/nostr-protocol/nips/blob/master/08.md)<br>
- [x] [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)<br>
- [x] [NIP-10: Conventions for clients' use of `e` and `p` tags in text events](https://github.com/nostr-protocol/nips/blob/master/10.md)<br>
- [x] [NIP-19: bech32-encoded entities](https://github.com/nostr-protocol/nips/blob/master/19.md)<br>
- [x] [NIP-20: Command Results](https://github.com/nostr-protocol/nips/blob/master/20.md)<br>
- [ ] [NIP-21: `nostr:` URL scheme](https://github.com/nostr-protocol/nips/blob/master/21.md)<br>
- [ ] [NIP-23: Long-form Content](https://github.com/nostr-protocol/nips/blob/master/23.md)<br>
- [x] [NIP-25: Reactions](https://github.com/nostr-protocol/nips/blob/master/25.md)<br>
- [ ] [NIP-26: Delegated Event Signing](https://github.com/nostr-protocol/nips/blob/master/26.md)<br>
- [ ] [NIP-28: Public Chat](https://github.com/nostr-protocol/nips/blob/master/28.md)<br>
- [x] [NIP-33: Parameterized Replaceable Events](https://github.com/nostr-protocol/nips/blob/master/33.md)<br>
- [ ] [NIP-39: External Identities in Profiles](https://github.com/nostr-protocol/nips/blob/master/39.md)<br>
- [ ] [NIP-40: Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md)<br>
- [x] [NIP-42: Authentication of clients to relays](https://github.com/nostr-protocol/nips/blob/master/42.md)<br>
- [ ] [NIP-46: Nostr Connect](https://github.com/nostr-protocol/nips/blob/master/46.md)<br>
- [x] [NIP-50: Keywords filter](https://github.com/nostr-protocol/nips/blob/master/50.md)<br>
- [ ] [NIP-51: Lists](https://github.com/nostr-protocol/nips/blob/master/51.md)<br>
- [ ] [NIP-56: Reporting](https://github.com/nostr-protocol/nips/blob/master/56.md)<br>
- [x] [NIP-57: Lightning Zaps](https://github.com/nostr-protocol/nips/blob/master/57.md)<br>
- [ ] [NIP-58: Badges](https://github.com/nostr-protocol/nips/blob/master/58.md)<br>
- [ ] [NIP-65: Relay List Metadata](https://github.com/nostr-protocol/nips/blob/master/65.md)<br>


## Privacy

The application is an unaudited proof-of-concept implementation, so don't use it for security critical purposes.

---

<a href="https://opencollective.com/iris-social/donate" target="_blank"><img src="https://opencollective.com/iris-social/donate/button@2x.png?color=blue" width=200 /></a>

## Contributors

<a align="center" href="https://github.com/irislib/iris-messenger/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=irislib/iris-messenger" />
</a>
