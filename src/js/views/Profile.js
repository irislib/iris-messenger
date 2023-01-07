import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { createRef } from 'preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Button from '../components/basic/Button';
import BlockButton from '../components/BlockButton';
import CopyButton from '../components/CopyButton';
import FeedMessageForm from '../components/FeedMessageForm';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import MessageFeed from '../components/MessageFeed';
import ProfilePicture from '../components/ProfilePicture';
import Helpers from '../Helpers';
import QRCode from '../lib/qrcode.min';
import Nostr from '../Nostr';
import { SMS_VERIFIER_PUB } from '../SMS';
import { translate as t } from '../translations/Translation';

import View from './View';

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

  onClickSettings() {
    $('#chat-settings').toggle();
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

  renderLinks() {
    return html`
      <div
        class="profile-links"
        style="flex:1; display: flex; flex-direction: row; align-items: center;"
      >
        ${this.state.lud16
          ? html`
              <div style="flex:1">
                <a href=${this.state.lud16}>⚡ Tip</a>
              </div>
            `
          : ''}
        ${this.state.website
          ? html`
              <div style="flex:1">
                <a href=${this.state.website}>
                  ${this.state.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            `
          : ''}
      </div>
    `;
  }

  renderDetails() {
    let profilePicture;
    if (this.state.picture && !this.state.blocked) {
      profilePicture = html`<${ProfilePicture}
        key=${this.props.id}
        picture=${this.state.picture}
      />`;
    } else {
      profilePicture = html`<${Identicon}
        key=${this.props.id}
        str=${this.props.id}
        hidePicture=${true}
        width="250"
      />`;
    }
    const hexPubKey = Nostr.toNostrHexAddress(this.props.id);
    return html`
      <div class="profile-top">
        <div class="profile-header">
          <div class="profile-picture-container">${profilePicture}</div>
          <div class="profile-header-stuff">
            <div style="display:flex; flex-direction:row;">
              <h3 style="flex: 1" class="profile-name">
                ${this.state.name || this.props.id.slice(0, 4) + '...' + this.props.id.slice(-4)}
              </h3>
              <div class="dropdown profile-actions">
                <div class="dropbtn">…</div>
                <div class="dropdown-content">
                  ${this.state.isMyProfile
                    ? html`<${Button} onClick=${() => route('/profile/edit')}>Edit profile<//>`
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
              <p class="profile-about-content">${this.state.about}</p>
              ${this.renderLinks()}
            </div>
            <div class="profile-actions">
              <div class="follow-count">
                <a href="/follows/${this.props.id}">
                  <span>${this.state.followedUserCount}</span> ${t('following')}
                </a>
                <a href="/followers/${this.props.id}">
                  <span>${this.state.followerCount}</span> ${t('followers')}
                </a>
              </div>
              ${Nostr.followedByUser.get(hexPubKey)?.has(iris.session.getKey().secp256k1.rpub)
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

        <div class="visible-xs-flex profile-actions" style="justify-content: flex-end">
          ${this.renderLinks()}
          ${this.state.isMyProfile
            ? ''
            : html`
                <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id} />
                ${this.state.showBetaFeatures
                  ? html`
                      <${Button} onClick=${() => route(`/chat/${this.props.id}`)}
                        >${t('send_message')}<//
                      >
                    `
                  : ''}
              `}
        </div>
        ${this.state.about
          ? html`
              <div class="profile-about visible-xs-flex">
                <p class="profile-about-content">${this.state.about}</p>
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
      return html`TODO media message feed`;
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
    Nostr.getProfile(address, (profile, addr) => {
      addr = Nostr.toNostrBech32Address(addr, 'npub');
      if (!profile || addr !== this.props.id) return;
      let lud16 = profile.lud16;
      if (lud16 && !lud16.startsWith('lightning:')) {
        lud16 = 'lightning:' + lud16;
      }

      let website =
        profile.website &&
        (profile.website.match(/^https?:\/\//) ? profile.website : 'http://' + profile.website);
      // remove trailing slash
      if (website && website.endsWith('/')) {
        website = website.slice(0, -1);
      }

      // profile may contain arbitrary fields, so be careful
      this.setState({
        name: profile.name,
        about: profile.about,
        picture: profile.picture,
        lud16,
        website: website,
      });
    });
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
      name: '',
      picture: '',
      about: '',
      blocked: false,
      lud16: null,
      website: null,
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
    this.getNostrProfile(nostrAddr);
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
    if (this.isUserAgentCrawler() && !this.state.ogImageUrl && !this.state.picture) {
      new iris.Attribute({ type: 'keyID', value: this.props.id })
        .identiconSrc({ width: 300, showType: false })
        .then((src) => {
          if (!this.state.ogImageUrl && !this.state.picture) {
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
