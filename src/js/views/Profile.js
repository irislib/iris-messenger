import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import iris from 'iris-lib';
import { createRef } from 'preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Button from '../components/basic/Button';
import BlockButton from '../components/BlockButton';
import CopyButton from '../components/CopyButton';
import Dropdown from '../components/Dropdown';
import FeedMessageForm from '../components/FeedMessageForm';
import FollowButton from '../components/FollowButton';
import Identicon from '../components/Identicon';
import MessageFeed from '../components/MessageFeed';
import Name from '../components/Name';
import ProfilePicture from '../components/ProfilePicture';
import ReportButton from '../components/ReportButton';
import Helpers from '../Helpers';
import QRCode from '../lib/qrcode.min';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import View from './View';

const QR = (props) => {
  const ref = createRef();
  //const [qr, setQr] = useState(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    new QRCode(ref.current, {
      text: props.text,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  }, [props.text]);

  return html`<div ref=${ref} />`;
};

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
                <a href=${this.state.lud16}>⚡ ${t('tip_lightning')}</a>
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

  async viewAs(event) {
    event.preventDefault();
    const k = await iris.Key.generate();
    k.secp256k1 = { rpub: this.state.hexPub, priv: null };
    route('/');
    iris.session.login(k);
  }

  renderDetails() {
    if (!this.state.hexPub) {
      return '';
    }
    let profilePicture;
    if (this.state.picture && !this.state.blocked && !this.state.profilePictureError) {
      profilePicture = html`<${ProfilePicture}
        key="${this.state.hexPub}picture"
        picture=${this.state.picture}
        onError=${() => this.setState({ profilePictureError: true })}
      />`;
    } else {
      profilePicture = html`<${Identicon}
        key="${this.state.npub}identicon"
        str=${this.state.npub}
        hidePicture=${true}
        width="250"
      />`;
    }
    let rawDataJson = JSON.stringify(
      Nostr.profileEventByUser.get(this.state.hexPub) || 'no profile :D',
      null,
      2,
    );
    rawDataJson = `${rawDataJson}\n\n${JSON.stringify(
      Nostr.followEventByUser.get(this.state.hexPub) || 'no contacts :D',
      null,
      2,
    )}`;
    return html`
      <div class="profile-top" key="${this.state.hexPub}details">
        <div class="profile-header">
          <div class="profile-picture-container">${profilePicture}</div>
          <div class="profile-header-stuff">
            <div style="display:flex; flex-direction:row;">
              <h3 style="flex: 1" class="profile-name">
                <${Name} pub=${this.state.hexPub} />
              </h3>
              <div class="profile-actions">
                <${Dropdown}>
                  ${this.state.isMyProfile
                    ? html`<${Button} onClick=${() => route('/profile/edit')}
                        >${t('edit_profile')}<//
                      >`
                    : ''}
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyLink`}
                    text=${t('copy_link')}
                    title=${this.state.name}
                    copyStr=${window.location.href}
                  />
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyNpub`}
                    text=${t('copy_user_ID')}
                    title=${this.state.name}
                    copyStr=${this.state.npub}
                  />
                  <${Button} onClick=${() => this.setState({ showQR: !this.state.showQR })}
                    >${t('show_qr_code')}<//
                  >
                  <${CopyButton}
                    key=${`${this.state.hexPub}copyData`}
                    text=${t('copy_raw_data')}
                    title=${this.state.name}
                    copyStr=${rawDataJson}
                  />
                  ${!this.state.isMyProfile && !iris.session.getKey().secp256k1.priv
                    ? html`
                        <${Button} onClick=${(e) => this.viewAs(e)}>
                          ${t('view_as') + ' '}
                          <${Name}
                            pub=${this.state.hexPub}
                            userNameOnly=${true}
                            hideBadge=${true}
                          />
                        <//>
                      `
                    : ''}
                  ${this.state.isMyProfile
                    ? ''
                    : html`
                        <${BlockButton} id=${this.state.hexPub} />
                        <${ReportButton} id=${this.state.hexPub} />
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
                <a href="/follows/${this.state.npub}">
                  <span>${this.state.followedUserCount}</span> ${t('following')}
                </a>
                <a href="/followers/${this.state.npub}">
                  <span>${this.state.followerCount}</span> ${t('followers')}
                </a>
              </div>
              ${Nostr.followedByUser
                .get(this.state.hexPub)
                ?.has(iris.session.getKey().secp256k1.rpub)
                ? html` <p><small>${t('follows_you')}</small></p> `
                : ''}
              <div class="hidden-xs">
                ${!this.state.isMyProfile
                  ? html`
                      <${FollowButton}
                        key=${`${this.state.hexPub}follow`}
                        id=${this.state.hexPub}
                      />
                    `
                  : ''}
                ${this.state.npub !==
                'npub1wnwwcv0a8wx0m9stck34ajlwhzuua68ts8mw3kjvspn42dcfyjxs4n95l8'
                  ? html` <${Button}
                      small=${true}
                      onClick=${() => route(`/chat/${this.state.npub}`)}
                    >
                      ${t('send_message')}
                    <//>`
                  : ''}
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
                  <${FollowButton} key=${`${this.state.hexPub}follow`} id=${this.state.hexPub} />
                  <${Button} small=${true} onClick=${() => route(`/chat/${this.state.npub}`)}>
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
        ${this.state.showQR ? html` <${QR} text=${`nostr:${this.state.npub}`} /> ` : ''}
      </div>
    `;
  }

  renderTabs() {
    return html`
      <div class="tabs">
        <${Link} activeClassName="active" href="/${this.state.npub}"
          >${t('posts')} ${this.state.noPosts ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/replies/${this.state.npub}"
          >${t('replies')} ${this.state.noReplies ? '(0)' : ''}<//
        >
        <${Link} activeClassName="active" href="/likes/${this.state.npub}"
          >${t('likes')} ${this.state.noLikes ? '(0)' : ''}<//
        >
      </div>
    `;
  }

  renderTab() {
    if (!this.state.hexPub) {
      return html`<div></div>`;
    }
    if (this.props.tab === 'replies') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="replies${this.state.hexPub}"
            index="postsAndReplies"
            nostrUser=${this.state.hexPub}
          />
        </div>
      `;
    } else if (this.props.tab === 'likes') {
      return html`
        <div class="public-messages-view">
          <${MessageFeed}
            scrollElement=${this.scrollElement.current}
            key="likes${this.state.hexPub}"
            index="likes"
            nostrUser=${this.state.hexPub}
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
            key="posts${this.state.hexPub}"
            index="posts"
            nostrUser=${this.state.hexPub}
          />
        </div>
      </div>
    `;
  }

  onNftImgError(e) {
    e.target.style = 'display:none';
  }

  renderView() {
    if (!this.state.hexPub) {
      return html`<div></div>`;
    }
    const title = this.state.display_name || this.state.name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${this.state.display_name || this.state.name || 'user'}. ${
      this.state.about || ''
    }`;
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
            ? html`
                <meta property="og:image" content=${this.state.picture} />
                <meta name="twitter:image" content=${this.state.picture} />
              `
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
      (profile) => {
        if (!profile) {
          return;
        }
        if (profile.nip05 && profile.nip05valid) {
          // replace url and history entry with iris.to/${profile.nip05} or if nip is user@iris.to, just iris.to/${user}
          const nip05 = profile.nip05;
          const nip05Parts = nip05.split('@');
          const nip05User = nip05Parts[0];
          const nip05Domain = nip05Parts[1];
          let newUrl;
          if (nip05Domain === 'iris.to') {
            if (nip05User === '_') {
              newUrl = '/iris';
            } else {
              newUrl = `/${nip05User}`;
            }
          } else {
            if (nip05User === '_') {
              newUrl = `/${nip05Domain}`;
            } else {
              newUrl = `/${nip05}`;
            }
          }
          window.history.replaceState({}, '', newUrl);
        }

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
          display_name: profile.display_name,
          about: Helpers.highlightText(profile.about),
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

  loadProfile(hexPub) {
    const isMyProfile = hexPub === iris.session.getKey().secp256k1.rpub;
    this.setState({ isMyProfile });
    this.followedUsers = new Set();
    this.followers = new Set();
    iris.local().get('noFollowers').on(this.inject());
    this.getNostrProfile(hexPub);
    Nostr.getBlockedUsers((blockedUsers) => {
      this.setState({ blocked: blockedUsers.has(hexPub) });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.name && this.state.name) {
      setTimeout(() => {
        // important for SEO: prerenderReady is false until page content is loaded
        window.prerenderReady = true;
      }, 1000); // give feed a sec to load
    }
  }

  componentDidMount() {
    this.restoreScrollPosition();
    const pub = this.props.id;
    const npub = Nostr.toNostrBech32Address(pub, 'npub');
    if (npub && npub !== pub) {
      route(`/${npub}`, true);
      return;
    }
    const hexPub = Nostr.toNostrHexAddress(pub);
    if (!hexPub) {
      // id is not a nostr address, but maybe it's a username
      let username = pub;
      if (!username.match(/.+@.+\..+/)) {
        // domain name?
        if (username.match(/.+\..+/)) {
          username = '_@' + username;
        } else {
          username = username + '@iris.to';
        }
      }
      Nostr.getPubKeyByNip05Address(username).then((pubKey) => {
        if (pubKey) {
          const npub = Nostr.toNostrBech32Address(pubKey, 'npub');
          if (npub && npub !== pubKey) {
            this.setState({ npub, hexPub: pubKey });
            this.loadProfile(pubKey);
          }
        } else {
          this.setState({ notFound: true });
        }
      });
      return;
    }
    this.setState({ hexPub, npub: Nostr.toNostrBech32Address(hexPub, 'npub') });
    this.loadProfile(hexPub);
  }
}

export default Profile;
