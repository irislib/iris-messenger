 [![Join the chat at https://gitter.im/METAVERSE-GUN/community](https://badges.gitter.im/METAVERSE-GUN/community.svg)](https://gitter.im/METAVERSE-GUN/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)<br>
Check the METAVERSE-GUN Wiki for Features and Masterplan https://github.com/worldpeaceenginelabs/METAVERSE-GUN/wiki

# METAVERSE-GUN (Iris Messenger + CesiumJS)
### aka "The Seed" aka "World Seed"
![Metaverse-Gun](https://user-images.githubusercontent.com/67427045/173232351-703fa1f3-f4e8-4635-be37-a903af958459.png)
<br><br><br>
![image](https://user-images.githubusercontent.com/67427045/173239465-dda15148-68cd-4e92-9432-026c079ac70d.png)

<br><br><br>

#### (12.06.2022 3PM, Europe)
I am about to add CesiumJS, to make the Mockup Starterkit a reality.<br>
But i am not as fast, since React/Preact is not my typical framework, so i added an instruction, which makes you able to do it yourself, and dont have to wait for me ;)

https://github.com/worldpeaceenginelabs/METAVERSE-GUN/blob/master/add-cesiumjs.js

Its copy-pasting 2 lines of code in index.html, and copy-pasting a snippet into the related js file of this METAVERSE-GUN repo (which is a clean Iris fork for now),<br>
and then adding Cesium under the Home Button, and whats now under the Iris Home button, as a new button under the Cesium Homebutton.

Then npm i cesium.

Done

### Feel free to open a pull-request. Thx in advance!

<br><br><br>

# Mockup Starterkit

#### Not an IT person? No worries, we got your back!
#### Templates and UI are on its way, so you can start being creative, even without being a professional!
#### But we will also not hold you back from using the professional tools. Every user has the same rights, at no cost!
<br>

![image](https://user-images.githubusercontent.com/67427045/173517008-7fd86049-48bb-491a-813f-9007b6afcb52.png)
<br><br><br>

# Mockup Metaverse-Gun App Store (MGAS)

#### There is a store with UI and even logic already integrated into Iris. Lets use it as a base for MGAS

![image](https://user-images.githubusercontent.com/67427045/173530828-d5528d86-9371-4170-8d12-4b79bbc66d4d.png)
<br><br><br>

# Mockup of Live Coding Console with hot reloading
### Every example you can do in Cesium Sandcastle and more...

![image](https://user-images.githubusercontent.com/67427045/173256852-77a9af68-0271-4da9-91cf-576bb177bd27.png)

<br><br><br>

# CesiumJS
### See CesiumJS live in action: https://sandcastle.cesium.com/

![image](https://user-images.githubusercontent.com/67427045/173238912-ef698643-d541-4c16-91da-34a507367fd5.png)


## 3D geospatial visualization for the web
CesiumJS is an open source JavaScript library for creating world-class 3D globes and maps with the best possible performance, precision, visual quality, and ease of use. Developers across industries, from aerospace to smart cities to drones, use CesiumJS to create interactive web apps for sharing dynamic geospatial data.

Built on open formats, CesiumJS is designed for robust interoperability and scaling for massive datasets.

- Stream in 3D Tiles and other standard formats from Cesium ion or another source
- Visualize and analyze on a high-precision WGS84 globe
- Share with users on desktop or mobile

<br>

## Bring the real world to Unreal Engine 5 and then back into the real world (web and desktop app, game, software, vr, webvr...)

### See Cesium for Unreal in action: https://cesium.com/platform/cesium-for-unreal/ (video)

![image](https://user-images.githubusercontent.com/67427045/173237155-12699b40-f737-41a5-83c5-019fc8b63736.png)

Built on open standards and APIs, Cesium for Unreal combines the 3D geospatial capability of Cesium with the high-fidelity rendering power of Unreal Engine, unlocking the 3D geospatial ecosystem for game engines.

- Free and open source visualization plugin
- A full-scale high-accuracy WGS84 globe for Unreal Engine
- Visualize massive high-resolution real-world photogrammetry and 3D content at runtime using 3D Tiles
- Integrated with Unreal Engine Editor, Actors and Components, Blueprints, and other UE features to enable a high degree of interactivity, physical realism, and photorealism to create amazing experiences
- Optional subscription to Cesium ion for one-click access to global curated 3D content including terrain, imagery, 3D cities, and photogrammetry

<br><br><br>

# Iris Messenger

### See Iris Messenger live in action: https://iris.to/

**Want social media where _you_ decide what gets into your feed, not some obscure algorithm? Something that can't be censored by authoritarian governments? No big tech companies that decide what you can post, what gets visibility and who gets to have an account? Yet no harassing troll accounts, spam or ads? Something that works locally even if ISPs are unavailable in an emergency situation?**

Here comes Iris. Iris is a social networking application that stores and indexes everything on the devices of its users and connects directly with peers who run the application - no corporate gatekeepers needed.

## Public and private messaging
Interface-wise, Iris is not too different from some existing social media. You can post texts, photos, videos, audio or other types of files into your feed.

![Feed](https://github.com/irislib/iris/raw/master/img/feed.png)

You can also chat privately or participate in public group discussions.

## Web of trust
You can create new Iris accounts (technically: cryptographic keypairs) at will, without asking for anyone's permission, but only the users whose web of trust upvoted your account will see its posts.

When you upvote someone, they become your 1st degree contact. The accounts they upvoted become 2nd degree contacts. Then there are 3rd degree contacts and so on. This is the web of trust, which can be used to filter all content on Iris. Hiding users by downvoting is also possible.

**This way we can avoid spam and other unwanted content without giving power to central moderators.**

You can also add to your contacts list and rate people and organisations who are not yet on Iris.
A decentralised web of trust, unlike certain big brother systems, could be a strong positive social force as envisioned in the blog post [Learning to Trust Strangers](https://medium.com/@mmalmi/learning-to-trust-strangers-167b652a654f). (Iris is evolved from thereby mentioned Identifi.)

## Attestations (identity verifications)
Keep your contact details up-to-date and ask for attestations from peers or specialised verifiers trusted by your WoT.

Use your Iris account for online authentication or identification on services that support it (browser extension and mobile app in development).

Crypto wallets could use Iris to connect human-recognizable identities to payment addresses. Encrypted messaging apps like Signal could use Iris to look up users instead of telecom-bound phone numbers.

If you lose access to your account (keypair), just create a new one and link it to your existing identity by asking for verifications from your web of trust.

## Name service
Through WoT attestations, Iris maps human readable names to public keys and other identity attributes, providing an alternative to centrally managed identifiers such as domain names, CA certificates, email addresses, phone numbers or social media handles.

Iris name search is interface-wise similar to many existing social media: instead of having to know someone's unique username, you can type in their non-unique natural name and get a dropdown list of matching contacts ordered by distance in your web of trust.

You can also do reverse name lookup, such as looking up a name for an unknown number that is calling you. Or you could look up who owns a bitcoin address - as perceived by your web of trust.

## Importing content from existing sources
An Iris message is digitally signed by the entity that verified its origin. In other words: message author and signer can be different entities, and only the signer needs to be on Iris.

For example, a crawler can import and sign other people's messages from Twitter. Only the users who trust the crawler will see the messages.

![Feed](https://github.com/irislib/iris/raw/master/img/msg.png)
*A message imported from the bitcoin trading site bitcoin-otc.com by "Bitcoin-otc.com crawler".*

Importing content from existing sources helps overcome the network effect. It solves the chicken and egg problem, making Iris a useful medium even with no initial user base.

## Tech stack
The [browser application](https://github.com/irislib/iris-messenger) runs on Preact. [Iris-electron](https://github.com/irislib/iris-electron) wraps it for desktop and adds peer sync over wifi (multicast).

[Iris-mobile](https://github.com/irislib/iris-mobile) is a React Native implementation (in development).

[Iris-lib](https://github.com/irislib/iris-lib) contains the core functionality of Iris that can be integrated to other applications. It is written in javascript for the browser and Node.js.

The task of data storage and networking is outsourced to [GUN](https://github.com/amark/gun), which manages the synchronization of data between different storages: RAM, localstorage, GUN websocket server, WebRTC peers, LAN multicast peers, IPFS (no adapter yet), S3 or others.

GUN enables subscription to data changes, so message feeds and identity profiles just update real-time without having to hit f5 or writing complex update logic.

[WEBTORRENT](https://github.com/webtorrent/webtorrent) is used to store file attachments and message backups.

## Need a relay?

#### ROD - Rust Object Database (non-wasm rust port of gun)<br>
!!!The decentralized METAVERSE-GUN syncs over ROD peers by default!!!<br>
https://heroku.com/deploy?template=https://github.com/mmalmi/rod<br>
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mmalmi/rod)

## Improving decentralisation
Currently the weak point of Iris's decentralisation is the list of initial peers, which could easily be blocked by governments or ISPs. By default, the application connects to IPFS default peers and a couple GUN peers. You can always add peers manually on the [settings page](https://irislib.github.io/#settings), but that is cumbersome for the average user.

[Iris-electron](https://github.com/irislib/iris-electron) and the upcoming mobile application can synchronize with peers on the same local area network. Bluetooth modules are not yet implemented, but will enable ad hoc networks of peers that need to meet each other only occasionally.

On the wide area network level, trusted contacts could exchange network addresses privately to avoid having them blocked or tracked. WebRTC's NAT traversal capabilities can enable direct connections between typical network endpoint users, but you still need a firewall-opened/port-forwarded rendez-vous node for them, and in some cases a relay node.

## How to help
**Donations** help keep the project going and are very much appreciated. You can donate via [Open Collective](https://opencollective.com/iris-social) or using bitcoin: 3GopC1ijpZktaGLXHb7atugPj9zPGyQeST

You can promote Iris by [creating an account](https://iris.to) and **sharing your profile link on your existing social networks**!

Contributions to the [browser application](https://github.com/irislib/iris-messenger) and the underlying [iris-lib](https://github.com/irislib/iris-lib) are very much appreciated.

If you want to integrate Iris with your product or service, please check out [iris-lib](https://github.com/irislib/iris-lib) and create Github issues if needed.

You are welcome to join the [ERA community](https://discord.gg/gnzgpBh) (GUN, Iris and other projects) on Discord!

## License

Iris is released under the terms of the MIT license. See `COPYING` for more information or see http://opensource.org/licenses/MIT.

---

![The Greek goddess Iris](https://upload.wikimedia.org/wikipedia/commons/7/7b/Venus_supported_by_Iris%2C_complaining_to_Mars_1820.jpg)
*Iris (middle): Greek goddess of the rainbow and messenger of the gods. Iris of the eye is named after her, because of the many colours of the iris.*
