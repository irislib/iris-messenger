import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { createRef } from 'preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import styled from 'styled-components';

import Button from '../components/basic/Button';
import BlockButton from '../components/BlockButton';
import CopyButton from '../components/CopyButton';
import FeedMessageForm from '../components/FeedMessageForm';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import MessageFeed from '../components/MessageFeed';
import ProfilePhoto from '../components/ProfilePhoto';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import Helpers from '../Helpers';
import QRCode from '../lib/qrcode.min';
import Nostr from '../Nostr';
import { SMS_VERIFIER_PUB } from '../SMS';
import { translate as t } from '../translations/Translation';

import View from './View';

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 10px;
  @media (max-width: 625px) {
    grid-gap: 1px;
  }
`;

// styled-component GalleryImage that has the menu (class="dropdown") in the top right corner
// & .dropbtn should have a black background shadow
const GalleryImage = styled.a`
  position: relative;
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  background-color: #ccc;
  background-image: url(${(props) => props.src});
  & .dropdown {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  & .dropbtn {
    padding-top: 0px;
    margin-top: -5px;
    text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
    color: white;
    user-select: none;
  }
`;

function deleteChat(pub) {
  if (confirm(`${t('delete_chat')}?`)) {
    iris.Channel.deleteChannel(iris.session.getKey(), pub);
    iris.session.channelIds.delete(pub);
    iris.local().get('channels').get(pub).put(null);
    route(`/chat`);
  }
}

class Profile extends View {
  constructor() {
    super();
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = 'profile';
    this.qrRef = createRef();
  }

  onProfilePhotoSet(src) {
    iris.public().get('profile').get('photo').put(src);
    iris.public().get('profile').get('nftPfp').put(false);
  }

  onAboutInput(e) {
    const about = $(e.target).text().trim();
    iris.public().get('profile').get('about').put(about);
  }

  onClickSettings() {
    $('#chat-settings').toggle();
  }

  onNameInput(e) {
    const name = $(e.target).text().trim();
    if (name.length) {
      iris.public().get('profile').get('name').put(name);
    }
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(iris.session.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p>
              <${CopyButton}
                text=${t('copy_link')}
                title=${iris.session.getMyName()}
                copyStr=${Helpers.getProfileLink(iris.session.getPubKey())}
              />
            </p>
            <small>${t('visibility')}</small>
          </div>
        </div>
      `;
    }
  }

  renderSettings() {
    const chat = iris.private(this.props.id);

    return html`
      <div id="chat-settings" style="display:none">
        <hr />
        <h3>${t('chat_settings')}</h3>
        <div class="profile-nicknames">
          <h4>${t('nicknames')}</h4>
          <p>
            ${t('nickname')}:
            <input
              value=${chat && chat.theirNickname}
              onInput=${(e) => chat && chat.put('nickname', e.target.value)}
            />
          </p>
          <p>
            ${t('their_nickname_for_you')}:
            <span>
              ${chat && chat.myNickname && chat.myNickname.length ? chat.myNickname : ''}
            </span>
          </p>
        </div>
        <div class="notification-settings">
          <h4>${t('notifications')}</h4>
          <input type="radio" id="notifyAll" name="notificationPreference" value="all" />
          <label for="notifyAll">${t('all_messages')}</label><br />
          <input
            type="radio"
            id="notifyMentionsOnly"
            name="notificationPreference"
            value="mentions"
          />
          <label for="notifyMentionsOnly">${t('mentions_only')}</label><br />
          <input type="radio" id="notifyNothing" name="notificationPreference" value="nothing" />
          <label for="notifyNothing">${t('nothing')}</label><br />
        </div>
        <hr />
        <p>
          <${Button} class="delete-chat" onClick=${() => deleteChat(this.props.id)}
            >${t('delete_chat')}<//
          >
        </p>
        <hr />
      </div>
    `;
  }

  // if window.ethereum is defined, suggest to sign a message with the user's ethereum account
  renderEthereum() {
    if (this.state.eth && this.state.eth.address) {
      return html`
        <p>
          Eth:
          <a href="https://etherscan.io/address/${this.state.eth.address}">
            ${this.state.eth.address.slice(0, 4)}...${this.state.eth.address.slice(-4)}
          </a>
          <i> </i>
          ${this.state.nfts.totalCount
            ? html` <br /><a href="/nfts/${this.props.id}">NFT (${this.state.nfts.totalCount})</a> `
            : ''}
        </p>
      `;
    }
  }

  renderDetails() {
    let profilePhoto;
    if (this.state.isMyProfile) {
      profilePhoto = html`<${ProfilePhotoPicker}
        currentPhoto=${this.state.photo}
        placeholder=${this.props.id}
        callback=${(src) => this.onProfilePhotoSet(src)}
      />`;
    } else if (this.state.photo && !this.state.blocked) {
      profilePhoto = html`<${ProfilePhoto} key=${this.props.id} photo=${this.state.photo} />`;
    } else {
      profilePhoto = html`<${Identicon}
        key=${this.props.id}
        str=${this.props.id}
        hidePhoto=${true}
        width="250"
      />`;
    }
    return html`
      <div class="profile-top">
        <div class="profile-header">
          <div class="profile-photo-container">${profilePhoto}</div>
          <div class="profile-header-stuff">
            <div style="display:flex; flex-direction:row;">
              <h3
                style="flex: 1"
                class="profile-name"
                placeholder=${this.state.isMyProfile ? t('name') : ''}
                contenteditable=${this.state.isMyProfile}
                onInput=${(e) => this.onNameInput(e)}
              >
                ${this.state.name || this.props.id.slice(0, 4) + '...' + this.props.id.slice(-4)}
              </h3>
              <div class="dropdown profile-actions">
                <div class="dropbtn">…</div>
                <div class="dropdown-content">
                  ${this.state.isMyProfile
                    ? ''
                    : html`<${BlockButton} key=${`${this.props.id}block`} id=${this.props.id} />`}
                  <${CopyButton}
                    key=${`${this.props.id}copyLink`}
                    text=${t('copy_link')}
                    title=${this.state.name}
                    copyStr=${window.location.href}
                  />
                  <${CopyButton}
                    key=${`${this.props.id}copyNpub`}
                    text=${t('copy_npub')}
                    title=${this.state.name}
                    copyStr=${this.props.id}
                  />
                  <${Button} onClick=${() => $(this.qrRef.current).toggle()}
                    >${t('show_qr_code')}<//
                  >
                </div>
              </div>
            </div>

            <div class="profile-about hidden-xs">
              <p
                class="profile-about-content"
                placeholder=${this.state.isMyProfile ? t('about') : ''}
                contenteditable=${this.state.isMyProfile}
                onInput=${(e) => this.onAboutInput(e)}
              >
                ${this.state.about}
              </p>
              ${this.state.lightning ? html`
                  <p>
                      <a href=${this.state.lightning}>⚡ Tip</a>
                  </p>
              ` : ''}
              ${this.state.website ? html`
                <p>
                  <a href=${this.state.website}>
                    ${this.state.website.replace(/^https?:\/\//, '')}
                  </a>
                </p>
            ` : ''}
            </div>
            ${this.state.nostr
              ? html`<a href="/profile/${this.state.nostr}">Nostr profile</a>`
              : ''}
            ${this.renderEthereum()}
            <div class="profile-actions">
              <div class="follow-count">
                <a href="/follows/${this.props.id}">
                  <span>${this.state.followedUserCount}</span> ${t('following')}
                </a>
                <a href="/followers/${this.props.id}">
                  <span>${this.state.followerCount}</span> ${t('followers')}
                </a>
              </div>
              ${this.followedUsers.has(iris.session.getPubKey()) ||
              this.followedUsers.has(iris.session.getKey().secp256k1.rpub)
                ? html` <p><small>${t('follows_you')}</small></p> `
                : this.props.id === SMS_VERIFIER_PUB
                ? html`
                    <p>
                      <a href="https://iris-sms-auth.herokuapp.com/?pub=${iris.session.getPubKey()}"
                        >${t('ask_for_verification')}</a
                      >
                    </p>
                  `
                : ''}
              ${this.state.isMyProfile
                ? ''
                : html`
                    <div class="hidden-xs">
                      <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id} />
                      ${this.state.showBetaFeatures
                        ? html`
                            <${Button} onClick=${() => route(`/chat/${this.props.id}`)}
                              >${t('send_message')}<//
                            >
                          `
                        : ''}
                    </div>
                  `}
            </div>
          </div>
        </div>

        ${this.state.isMyProfile
          ? ''
          : html`
              <div class="visible-xs-flex profile-actions" style="justify-content: flex-end">
                <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id} />
                ${this.state.showBetaFeatures
                  ? html`
                      <${Button} onClick=${() => route(`/chat/${this.props.id}`)}
                        >${t('send_message')}<//
                      >
                    `
                  : ''}
              </div>
            `}
        ${this.state.isMyProfile || this.state.about
          ? html`
              <div class="profile-about visible-xs-flex">
                <p
                  class="profile-about-content"
                  placeholder=${this.state.isMyProfile ? t('about') : ''}
                  contenteditable=${this.state.isMyProfile}
                  onInput=${(e) => this.onAboutInput(e)}
                >
                  ${this.state.about}
                </p>
              </div>
            `
          : ''}

        <p ref=${this.qrRef} style="display:none" class="qr-container"></p>
        ${this.renderSettings()}
      </div>
    `;
  }

  renderTabs() {
    return html`
      <div class="tabs">
        <${Link} activeClassName="active" href="/profile/${this.props.id}"
          >${t('posts')} ${this.state.noPosts ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/replies/${this.props.id}"
          >${t('replies')} ${this.state.noReplies ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/likes/${this.props.id}"
          >${t('likes')} ${this.state.noLikes ? '(0)' : ''}<//
        >
      </div>
    `;
  }

  useAsPfp(nft, e) {
    e.preventDefault();
    let src = this.getSrcForNft(nft, false);
    if (src.indexOf('data:image') === 0) {
      iris.public().get('profile').get('photo').put(src);
    } else {
      // load image and convert to base64
      const img = new Image();
      if (src.indexOf('ipfs://') === 0) {
        src = `https://ipfs.io/ipfs/${src.substring(7)}`;
      }
      img.src = src;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        iris.public().get('profile').get('photo').put(dataURL);
      };
    }
    $('.main-view').animate(
      {
        scrollTop: 0,
      },
      'slow',
    );
  }

  getSrcForNft(nft, thumbnail = true) {
    let src = '';
    if (nft.rawMetadata.image_url) {
      src = nft.rawMetadata.image_url;
    } else if (nft.rawMetadata.image) {
      src = nft.rawMetadata.image;
    } else if (nft.media && nft.media[0]) {
      if (nft.media[0].gateway) {
        src = nft.media[0].gateway;
      }
      src = nft.media[0].raw;
    }
    if (src && src.indexOf('data:image') !== 0) {
      if (src && src.indexOf('ipfs://') === 0) {
        src = `https://ipfs.io/ipfs/${src.substring(7)}`;
      } else if (src && src.indexOf('https://ipfs.io/ipfs/') !== 0) {
        src = `https://proxy.irismessengers.wtf/insecure/${
          thumbnail ? 'rs:fill:520:520/' : ''
        }plain/${src}`;
      }
    }
    return src;
  }

  renderTab() {
    const nostrAddr = Nostr.toNostrHexAddress(this.props.id);
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="replies${this.props.id}"
            index="postsAndReplies"
            nostrUser=${nostrAddr}
          />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="likes${this.props.id}"
            index="likes"
            nostrUser=${nostrAddr}
          />
        </div>
      `;
    } else if (this.props.tab === 'media') {
      return html`
        <div class="public-messages-view">
          ${this.state.isMyProfile
            ? html`<${FeedMessageForm} index="media" class="hidden-xs" autofocus=${false} />`
            : ''}
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="media${this.props.id}"
            node=${iris.public(this.props.id).get('media')}
          />
        </div>
      `;
    } else if (this.props.tab === 'nfts') {
      return html`
        <div class="public-messages-view">
          <${ImageGrid}>
            ${this.state.nfts &&
            this.state.nfts.ownedNfts &&
            this.state.nfts.ownedNfts.map((nft) => {
              let src = this.getSrcForNft(nft, true);
              return html`
                <${GalleryImage}
                  href="https://etherscan.io/address/${nft.contract.address}"
                  target="_blank"
                  src=${src}
                >
                  ${this.state.isMyProfile
                    ? html`
                        <div class="dropdown">
                          <div class="dropbtn">…</div>
                          <div class="dropdown-content">
                            <a href="#" onClick=${(e) => this.useAsPfp(nft, e)}
                              >${t('use_as_PFP')}</a
                            >
                          </div>
                        </div>
                      `
                    : ''}
                <//>
              `;
            })}
          <//>
        </div>
      `;
    }
    const messageForm = this.state.isMyProfile
      ? html`<${FeedMessageForm} class="hidden-xs" autofocus=${false} />`
      : '';

    return html`
      <div>
        ${messageForm}
        <div class="public-messages-view">
          ${this.getNotification()}
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="posts${this.props.id}"
            index="posts"
            nostrUser=${nostrAddr}
          />
        </div>
      </div>
    `;
  }

  onNftImgError(e) {
    e.target.style = 'display:none';
  }

  renderView() {
    const title = this.state.name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${this.state.name || 'user'}. ${this.state.about || ''}`;
    return html`
      <div class="content">
        <${Helmet}>
          <title>${title}</title>
          <meta name="description" content=${description} />
          <meta property="og:type" content="profile" />
          ${this.state.ogImageUrl
            ? html`<meta property="og:image" content=${this.state.ogImageUrl} />`
            : ''}
          <meta property="og:title" content=${ogTitle} />
          <meta property="og:description" content=${description} />
        <//>
        ${this.renderDetails()} ${this.state.blocked ? '' : this.renderTabs()}
        ${this.state.blocked ? '' : this.renderTab()}
      </div>
    `;
  }

  async getNfts(address) {
    const { Alchemy, Network } = await import('alchemy-sdk');
    const config = {
      apiKey: 'DGLWKXjx7nRC5Dmz7mavP8CX1frKT1Ar',
      network: Network.ETH_MAINNET,
    };
    const alchemy = new Alchemy(config);

    const main = async () => {
      // Get all NFTs
      const nfts = await alchemy.nft.getNftsForOwner(address);
      // Print NFTs
      this.setState({ nfts });
      console.log('nfts', address, nfts);
    };

    const runMain = async () => {
      try {
        await main();
      } catch (error) {
        console.log(error);
      }
    };

    runMain();
  }

  getNostrProfile(address) {
    Nostr.sendSubToRelays([{ authors: [address] }], address, true, 30 * 1000);
    const setFollowCounts = () => {
      address &&
        this.setState({
          followedUserCount: Nostr.followedByUser.get(address)?.size ?? 0,
          followerCount: Nostr.followersByUser.get(address)?.size ?? 0,
        });
    };
    Nostr.getFollowersByUser(address, setFollowCounts);
    Nostr.getFollowedByUser(address, setFollowCounts);
    Nostr.getProfile(address, (data, addr) => {
      addr = Nostr.toNostrBech32Address(addr, 'npub');
      if (!data || addr !== this.props.id) return;
      let lightning = data.lightning;
      if (lightning && !lightning.startsWith('lightning:')) {
        lightning = 'lightning:' + lightning;
      }

      this.setState({
        name: data.name,
        about: data.about,
        photo: data.photo,
        lightning,
        website: data.website,
      });
    });
  }

  getProfileDetails() {
    const pub = this.props.id;
    iris
      .public(pub)
      .get('follow')
      .map()
      .on(
        this.sub((following, key) => {
          if (following) {
            this.followedUsers.add(key);
          } else {
            this.followedUsers.delete(key);
          }
          this.setState({ followedUserCount: this.followedUsers.size });
        }),
      );
    iris.group().count(
      `follow/${pub}`,
      this.sub((followerCount) => {
        this.setState({ followerCount });
      }),
    );
    iris
      .public(pub)
      .get('profile')
      .get('nostr')
      .on(
        this.sub(async (nostr) => {
          try {
            nostr = JSON.parse(nostr);
            const valid = await iris.Key.schnorrVerify(nostr.sig, pub, nostr.rpub);
            valid && this.setState({ nostr: nostr.rpub });
          } catch (e) {
            console.log('nostr parse error', e);
          }
        }),
      );
    iris
      .public(pub)
      .get('profile')
      .get('name')
      .on(
        this.sub((name) => {
          if (!$('#profile .profile-name:focus').length) {
            this.setState({ name });
          }
        }),
      );
    iris
      .public(pub)
      .get('profile')
      .get('photo')
      .on(
        this.sub((photo) => {
          this.setState({ photo });
          this.setOgImageUrl(photo);
        }),
      );
    iris
      .public(pub)
      .get('profile')
      .get('about')
      .on(
        this.sub((about) => {
          if (!$('#profile .profile-about-content:focus').length) {
            this.setState({ about });
          } else {
            $('#profile .profile-about-content:not(:focus)').text(about);
          }
        }),
      );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.unsubscribe();
      this.subscribeProfile();
    }
  }

  subscribeProfile() {
    const pub = this.props.id;
    const nostrNpub = Nostr.toNostrBech32Address(pub, 'npub');
    if (nostrNpub && nostrNpub !== pub) {
      route(`/profile/${nostrNpub}`, true);
      return;
    }
    const nostrHex = Nostr.toNostrHexAddress(pub);
    const isMyProfile =
      iris.session.getPubKey() === pub || nostrHex === iris.session.getKey().secp256k1.rpub;
    this.followedUsers = new Set();
    this.followers = new Set();
    this.setState({
      followedUserCount: 0,
      followerCount: 0,
      isMyProfile,
      noPosts: false,
      noReplies: false,
      noLikes: false,
      noMedia: false,
      nostr: null,
      iris: nostrNpub && isMyProfile ? iris.session.getPubKey() : null,
      eth: null,
      name: '',
      photo: '',
      about: '',
      blocked: false,
      ethereumAddress: null,
      nfts: [],
    });
    const chat = iris.private(pub);
    if (pub.length < 40) {
      if (!chat) {
        const interval = setInterval(() => {
          if (iris.private(pub)) {
            clearInterval(interval);
            this.componentDidMount();
          }
        }, 1000);
      }
    }
    let qrCodeEl = $(this.qrRef.current);
    qrCodeEl.empty();
    iris.local().get('noFollowers').on(this.inject());
    iris.local().get('settings').get('showBetaFeatures').on(this.inject());
    // if pub is hex, it's a nostr address
    const nostrAddr = Nostr.toNostrHexAddress(pub);
    if (nostrAddr) {
      this.getNostrProfile(nostrAddr);
    } else {
      this.getProfileDetails();
    }
    if (chat) {
      $(`input[name=notificationPreference][value=${chat.notificationSetting}]`).attr(
        'checked',
        'checked',
      );
      $('input:radio[name=notificationPreference]')
        .off()
        .on('change', (event) => {
          chat.put('notificationSetting', event.target.value);
        });
    }
    qrCodeEl.empty();
    new QRCode(qrCodeEl.get(0), {
      text: window.location.href,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
    iris
      .public()
      .get('block')
      .get(this.props.id)
      .on(
        this.sub((blocked) => {
          this.setState({ blocked });
        }),
      );
    iris.public(this.props.id).on(
      this.sub((user) => {
        this.setState({
          noPosts: !user.msgs,
          noMedia: !user.media,
          noLikes: !user.likes,
          noReplies: !user.replies,
        });
      }),
    );
    if (this.isUserAgentCrawler() && !this.state.ogImageUrl && !this.state.photo) {
      new iris.Attribute({ type: 'keyID', value: this.props.id })
        .identiconSrc({ width: 300, showType: false })
        .then((src) => {
          if (!this.state.ogImageUrl && !this.state.photo) {
            this.setOgImageUrl(src);
          }
        });
    }
  }

  componentDidMount() {
    this.subscribeProfile();
  }
}

export default Profile;
