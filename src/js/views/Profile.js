import { Helmet } from 'react-helmet';
import { html } from 'htm/preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Block from '../components/buttons/Block';
import { Button } from '../components/buttons/Button';
import Copy from '../components/buttons/Copy';
import Follow from '../components/buttons/Follow';
import Report from '../components/buttons/Report';
import Dropdown from '../components/Dropdown';
import Feed from '../components/Feed';
import Identicon from '../components/Identicon';
import Name from '../components/Name';
import ProfilePicture from '../components/ProfilePicture';
import QrCode from '../components/QrCode';
import { isSafeOrigin } from '../components/SafeImg';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import PubSub from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
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
    this.subscriptions = [];
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(Key.getPubKey())) {
      return html`
        <div class="msg">
          <div class="msg-content">
            <p>Share your profile link so ${this.state.name || 'this user'} can follow you:</p>
            <p>
              <${Copy} text=${t('copy_link')} copyStr=${Helpers.getMyProfileLink()} />
            </p>
            <small>${t('no_followers_yet_info')}</small>
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
        ${this.state.lightning
          ? html`
              <div style="flex:1">
                <a
                  href=${this.state.lightning}
                  onClick=${(e) => Helpers.handleLightningLinkClick(e)}
                >
                  ⚡ ${t('tip_lightning')}
                </a>
              </div>
            `
          : ''}
        ${this.state.website
          ? html`
              <div style="flex:1">
                <a href=${this.state.website} target="_blank">
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
    route('/');
    Key.login({ rpub: this.state.hexPub });
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
    let rawDataJson = [];
    const profileEvent = Events.db.findOne({ kind: 0, pubkey: this.state.hexPub });
    const followEvent = Events.db.findOne({ kind: 3, pubkey: this.state.hexPub });
    if (profileEvent) {
      delete profileEvent.$loki;
      rawDataJson.push(profileEvent);
    }
    if (followEvent) {
      delete followEvent.$loki;
      rawDataJson.push(followEvent);
    }
    rawDataJson = JSON.stringify(rawDataJson, null, 2);
    return html`
      <div class="profile-top" key="${this.state.hexPub}details">
        <div class="profile-header" style="flex-direction: column">
          <div class="profile-header-top" style="display: flex; flex-direction: row">
            <div
              class="profile-picture-container"
              style="flex: 2;margin-top:${this.state.banner ? '-100px;' : ''}"
            >
              ${profilePicture}
            </div>
            <div
              class="profile-header-info"
              style="flex: 5;flex-direction: row; display:flex;margin-top:20px;justify-content: flex-end"
            >
              <div>
                ${this.state.isMyProfile
                  ? html`<${Button} small onClick=${() => route('/profile/edit')}
                      >${t('edit_profile')}<//
                    >`
                  : html`
                      <${Follow} key=${`${this.state.hexPub}follow`} id=${this.state.hexPub} />
                      ${this.state.npub !==
                      'npub1wnwwcv0a8wx0m9stck34ajlwhzuua68ts8mw3kjvspn42dcfyjxs4n95l8'
                        ? html` <${Button} small onClick=${() => route(`/chat/${this.state.npub}`)}>
                            <span class="hidden-xs"> ${t('send_message')} </span>
                            <span class="visible-xs-inline-block msg-btn-icon">
                              ${Icons.chat}
                            </span>
                          <//>`
                        : ''}
                    `}
              </div>
              <div class="profile-actions">
                <span style="margin: 0 15px">
                  <${Dropdown}>
                    <${Copy}
                      key=${`${this.state.hexPub}copyLink`}
                      text=${t('copy_link')}
                      title=${this.state.name}
                      copyStr=${window.location.href}
                    />
                    <${Copy}
                      key=${`${this.state.hexPub}copyNpub`}
                      text=${t('copy_user_ID')}
                      title=${this.state.name}
                      copyStr=${this.state.npub}
                    />
                    <${Button} onClick=${() => this.setState({ showQR: !this.state.showQR })}
                      >${t('show_qr_code')}<//
                    >
                    <${Copy}
                      key=${`${this.state.hexPub}copyData`}
                      text=${t('copy_raw_data')}
                      title=${this.state.name}
                      copyStr=${rawDataJson}
                    />
                    ${!this.state.isMyProfile && !Key.getPrivKey()
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
                          <${Block} id=${this.state.hexPub} />
                          <${Report} id=${this.state.hexPub} />
                        `}
                  <//>
                </span>
              </div>
            </div>
          </div>
          <div class="profile-header-stuff">
            <div style="flex: 1" class="profile-name">
              <h3 style="margin-top:0;margin-bottom:0">
                <${Name} pub=${this.state.hexPub} />
                ${this.state.nip05
                  ? html`<br /><small class="positive"
                        >${this.state.nip05.replace(/^_@/, '')}</small
                      >`
                  : ''}
              </h3>
            </div>
            <div class="profile-about">
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
              ${SocialNetwork.followedByUser.get(this.state.hexPub)?.has(Key.getPubKey())
                ? html` <div><small>${t('follows_you')}</small></div> `
                : ''}
            </div>
          </div>
        </div>
        ${this.state.showQR
          ? html` <${QrCode} data=${`https://iris.to/${this.state.npub}`} /> `
          : ''}
      </div>
    `;
  }

  renderTabs() {
    return html`
      <div class="tabs">
        <${Link} activeClassName="active" href="/${this.state.nostrAddress || this.state.npub}"
          >${t('posts')} ${this.state.noPosts ? '(0)' : ''}<//
        >
        <${Link}
          activeClassName="active"
          href="/replies/${this.state.nostrAddress || this.state.npub}"
          >${t('posts')} & ${t('replies')} ${this.state.noReplies ? '(0)' : ''}<//
        >
        <${Link}
          activeClassName="active"
          href="/likes/${this.state.nostrAddress || this.state.npub}"
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
          <${Feed}
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
          <${Feed}
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

    return html`
      <div>
        <div class="public-messages-view">
          ${this.getNotification()}
          <${Feed}
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
      this.state.profile?.about || ''
    }`;
    return html`
      ${this.state.banner
        ? html`
            <div class="profile-banner" style="background-image: url(${this.state.banner})"></div>
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

  getNostrProfile(address, nostrAddress) {
    this.unsub = PubSub.subscribe(
      {
        authors: [address],
        kinds: [0, 3],
      },
      undefined,
      false,
      false,
    );
    fetch(`https://us.rbr.bio/${address}/info.json`).then((res) => {
      if (!res.ok) {
        return;
      }
      res.json().then((json) => {
        if (json) {
          this.setState({
            followerCount: json.followerCount || this.state.followercount,
            followedUserCount: json.following?.length || this.state.followedUserCount,
          });
        }
      });
    });
    const setFollowCounts = () => {
      address &&
        this.setState({
          followedUserCount: Math.max(
            SocialNetwork.followedByUser.get(address)?.size ?? 0,
            this.state.followedUserCount,
          ),
          followerCount: Math.max(
            SocialNetwork.followersByUser.get(address)?.size ?? 0,
            this.state.followerCount,
          ),
        });
    };
    this.subscriptions.push(SocialNetwork.getFollowersByUser(address, setFollowCounts));
    this.subscriptions.push(SocialNetwork.getFollowedByUser(address, setFollowCounts));
    const unsub = SocialNetwork.getProfile(
      address,
      (profile) => {
        if (!profile) {
          return;
        }
        const isIrisAddress = nostrAddress && nostrAddress.endsWith('@iris.to');
        if (!isIrisAddress && profile.nip05 && profile.nip05valid) {
          // replace url and history entry with iris.to/${profile.nip05} or if nip is user@iris.to, just iris.to/${user}
          // TODO don't replace if at /likes or /replies
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
          const previousState = window.history.state;
          window.history.replaceState(previousState, '', newUrl);
        }

        let lightning = profile.lud16 || profile.lud06;
        if (lightning && !lightning.startsWith('lightning:')) {
          lightning = 'lightning:' + lightning;
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
          banner = isSafeOrigin(banner)
            ? banner
            : `https://imgproxy.iris.to/insecure/plain/${banner}`;
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
          lightning,
          website: website,
          banner,
          profile,
        });
      },
      true,
    );
    this.subscriptions.push(unsub);
  }

  loadProfile(hexPub, nostrAddress) {
    const isMyProfile = hexPub === Key.getPubKey();
    this.setState({ isMyProfile });
    this.followedUsers = new Set();
    this.followers = new Set();
    localState.get('noFollowers').on(this.inject());
    this.getNostrProfile(hexPub, nostrAddress);
    this.subscriptions.push(
      SocialNetwork.getBlockedUsers((blockedUsers) => {
        this.setState({ blocked: blockedUsers.has(hexPub) });
      }),
    );
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.unsub?.();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.name && this.state.name) {
      this.unsub?.();
      setTimeout(() => {
        // important for SEO: prerenderReady is false until page content is loaded
        window.prerenderReady = true;
      }, 1000); // give feed a sec to load
    }
  }

  componentDidMount() {
    this.restoreScrollPosition();
    const pub = this.props.id;
    const npub = Key.toNostrBech32Address(pub, 'npub');
    if (npub && npub !== pub) {
      route(`/${npub}`, true);
      return;
    }
    const hexPub = Key.toNostrHexAddress(pub);
    if (!hexPub) {
      // id is not a nostr address, but maybe it's a username
      let nostrAddress = pub;
      if (!nostrAddress.match(/.+@.+\..+/)) {
        // domain name?
        if (nostrAddress.match(/.+\..+/)) {
          nostrAddress = '_@' + nostrAddress;
        } else {
          nostrAddress = nostrAddress + '@iris.to';
        }
      }
      Key.getPubKeyByNip05Address(nostrAddress).then((pubKey) => {
        if (pubKey) {
          const npub = Key.toNostrBech32Address(pubKey, 'npub');
          if (npub && npub !== pubKey) {
            this.setState({ npub, hexPub: pubKey, nostrAddress });
            this.loadProfile(pubKey, nostrAddress);
          }
        } else {
          this.setState({ notFound: true });
        }
      });
      return;
    }
    this.setState({ hexPub, npub: Key.toNostrBech32Address(hexPub, 'npub') });
    this.loadProfile(hexPub);
  }
}

export default Profile;
