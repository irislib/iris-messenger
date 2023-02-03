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
import Dropdown from '../components/Dropdown';
import FeedMessageForm from '../components/FeedMessageForm';
import FlagButton from '../components/FlagButton';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import MessageFeed from '../components/MessageFeed';
import Name from '../components/Name';
import ProfilePicture from '../components/ProfilePicture';
import Helpers from '../Helpers';
import QRCode from '../lib/qrcode.min';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import View from './View';

class Profile extends View {
  constructor() {
    super();
    this.state = {
      followedUserCount: 0,
      followerCount: 0,
    };
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = 'profile';
    this.qrRef = createRef();
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
        key="${this.props.id}picture"
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
    let rawDataJson = JSON.stringify(
      Nostr.profileEventByUser.get(hexPubKey) || 'no profile :D',
      null,
      2,
    );
    rawDataJson = `${rawDataJson}\n\n${JSON.stringify(
      Nostr.followEventByUser.get(hexPubKey) || 'no contacts :D',
      null,
      2,
    )}`;
    return html`
      <div class="profile-top" key="${this.props.id}details">
        <div class="profile-header">
          <div class="profile-picture-container">${profilePicture}</div>
          <div class="profile-header-stuff">
            <div style="display:flex; flex-direction:row;">
              <h3 style="flex: 1" class="profile-name">
                <${Name} pub=${this.props.id} />
              </h3>
              <div class="profile-actions">
                <${Dropdown}>
                  ${this.state.isMyProfile
                    ? html`<${Button} onClick=${() => route('/profile/edit')}>Edit profile<//>`
                    : ''}
                  <${CopyButton}
                    key=${`${this.props.id}copyLink`}
                    text=${t('copy_link')}
                    title=${this.state.name}
                    copyStr=${window.location.href}
                  />
                  <${CopyButton}
                    key=${`${this.props.id}copyNpub`}
                    text=${t('copy_user_ID')}
                    title=${this.state.name}
                    copyStr=${this.props.id}
                  />
                  <!-- <${Button} onClick=${() => $(this.qrRef.current).toggle()}
                    >${t('show_qr_code')}<//
                  > -->
                  <${CopyButton}
                    key=${`${this.props.id}copyData`}
                    text=${t('copy_raw_data')}
                    title=${this.state.name}
                    copyStr=${rawDataJson}
                  />
                  ${this.state.isMyProfile
                    ? ''
                    : html`
                        <${BlockButton} id=${this.props.id} />
                        <${FlagButton} id=${this.props.id} />
                      `}
                <//>
              </div>
            </div>

            ${this.state.nip05
              ? html`<div class="positive">${this.state.nip05.replace(/^_@/, '')}</div>`
              : ''}

            <div class="profile-about hidden-xs">
              <p class="profile-about-content">${this.state.about}</p>
              ${this.renderLinks()}
            </div>
            <div class="profile-actions">
              <div class="follow-count">
                <a href="#/follows/${this.props.id}">
                  <span>${this.state.followedUserCount}</span> ${t('following')}
                </a>
                <a href="#/followers/${this.props.id}">
                  <span>${this.state.followerCount}</span> ${t('followers')}
                </a>
              </div>
              ${Nostr.followedByUser.get(hexPubKey)?.has(iris.session.getKey().secp256k1.rpub)
                ? html` <p><small>${t('follows_you')}</small></p> `
                : ''}
              <div class="hidden-xs">
                ${!this.state.isMyProfile
                  ? html` <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id} /> `
                  : ''}
                <${Button} small=${true} onClick=${() => route(`/chat/${this.props.id}`)}>
                  ${t('send_message')}
                <//>
              </div>
            </div>
          </div>
        </div>

        <div class="visible-xs-flex profile-actions" style="justify-content: flex-end">
          ${this.renderLinks()}
          ${this.state.isMyProfile
            ? ''
            : html`
                <div>
                  <${FollowButton} key=${`${this.props.id}follow`} id=${this.props.id} />
                  <${Button} small=${true} onClick=${() => route(`/chat/${this.props.id}`)}>
                    ${t('send_message')}
                  <//>
                </div>
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
      ${this.state.banner
        ? html`
            <div
              class="profile-banner"
              style="background-image:linear-gradient(
    to bottom, transparent, var(--main-color)
  ), url(${this.state.banner})"
            ></div>
          `
        : ''}
      <div class="content">
        <${Helmet}>
          <title>${title}</title>
          <meta name="description" content=${description} />
          <meta property="og:type" content="profile" />
          ${this.state.picture
            ? html`<meta property="og:image" content=${this.state.picture} />`
            : ''}
          <meta property="og:title" content=${ogTitle} />
          <meta property="og:description" content=${description} />
        <//>
        ${this.renderDetails()} ${this.state.blocked ? '' : this.renderTabs()}
        ${this.state.blocked ? '' : this.renderTab()}
      </div>
    `;
  }

  getNostrProfile(address) {
    Nostr.sendSubToRelays([{ authors: [address] }], address, true, 15 * 1000);
    const setFollowCounts = () => {
      address &&
        this.setState({
          followedUserCount: Nostr.followedByUser.get(address)?.size ?? 0,
          followerCount: Nostr.followersByUser.get(address)?.size ?? 0,
        });
    };
    Nostr.getFollowersByUser(address, setFollowCounts);
    Nostr.getFollowedByUser(address, setFollowCounts);
    Nostr.getProfile(
      address,
      (profile, addr) => {
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

        let banner;

        try {
          banner = profile.banner && new URL(profile.banner).toString();
        } catch (e) {
          console.log('Invalid banner URL', profile.banner);
        }

        // profile may contain arbitrary fields, so be careful
        this.setState({
          name: profile.name,
          about: profile.about,
          picture: profile.picture,
          nip05: profile.nip05valid && profile.nip05,
          lud16,
          website: website,
          banner,
        });
      },
      true,
    );
  }

  componentDidMount() {
    this.restoreScrollPosition();
    const pub = this.props.id;
    const nostrNpub = Nostr.toNostrBech32Address(pub, 'npub');
    if (nostrNpub && nostrNpub !== pub) {
      route(`/profile/${nostrNpub}`, true);
      return;
    }
    const nostrHex = Nostr.toNostrHexAddress(pub);
    const isMyProfile =
      iris.session.getPubKey() === pub || nostrHex === iris.session.getKey().secp256k1.rpub;
    this.setState({ isMyProfile });
    this.followedUsers = new Set();
    this.followers = new Set();
    let qrCodeEl = $(this.qrRef.current);
    qrCodeEl.empty();
    iris.local().get('noFollowers').on(this.inject());
    // if pub is hex, it's a nostr address
    const nostrAddr = Nostr.toNostrHexAddress(pub);
    this.getNostrProfile(nostrAddr);
    qrCodeEl.empty();
    new QRCode(qrCodeEl.get(0), {
      text: window.location.href,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
    Nostr.getBlockedUsers((blockedUsers) => {
      this.setState({ blocked: blockedUsers.has(nostrAddr) });
    });
  }
}

export default Profile;
