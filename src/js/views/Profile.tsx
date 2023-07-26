import { Helmet } from 'react-helmet';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Copy from '../components/buttons/Copy';
import Feed from '../components/feed/Feed';
import Show from '../components/helpers/Show';
import { isSafeOrigin } from '../components/SafeImg';
import ProfileCard from '../components/user/ProfileCard';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Key from '../nostr/Key';
import PubSub from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';
import TrustProfileButtons from '../dwotr/components/TrustProfileButtons';
import ProfileFollowerLinks from '../components/ProfileFollowerLinks';
import ProfileTrustLinks from '../dwotr/components/ProfileTrustLinks';
import profileManager from '../dwotr/ProfileManager';

class Profile extends View {
  followedUsers: Set<string>;
  followers: Set<string>;
  subscriptions: any[];
  unsub: any;

  constructor() {
    super();
    this.state = {};
    this.followedUsers = new Set();
    this.followers = new Set();
    this.id = 'profile';
    this.subscriptions = [];
  }

  getNotification() {
    if (this.state.noFollowers && this.followers.has(Key.getPubKey())) {
      return (
        <div className="msg">
          <div className="msg-content">
            <p>Share your profile link so {this.state.name || 'this user'} can follow you:</p>
            <p>
              <Copy text={t('copy_link')} copyStr={Helpers.getMyProfileLink()} />
            </p>
            <small>{t('no_followers_yet_info')}</small>
          </div>
        </div>
      );
    }
  }

  renderLinks() {
    return (
      <div className="flex flex-1 flex-row align-center justify-center mt-2">
        <Show when={this.state.lightning}>
          <div className="flex-1">
            <a
              className="btn btn-sm btn-neutral"
              href={this.state.lightning}
              onClick={(e) => Helpers.handleLightningLinkClick(e)}
            >
              ⚡ {t('tip_lightning')}
            </a>
          </div>
        </Show>
        <Show when={this.state.website}>
          <div className="flex-1">
            <a href={this.state.website} target="_blank" className="link">
              {this.state.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </Show>
      </div>
    );
  renderWebSiteLink(state:any) {
    return (
      <>
      {state.website ? (
          <a href={state.website} target="_blank">
            {state.website.replace(/^https?:\/\//, '')}
          </a>
      ) : (
        ''
      )}
      </>
    );
  }

  renderActionButtons(state: any) {
    if (this.state.isMyProfile) return this.renderWebSiteLink(state);

    return (
      <>
        <TrustProfileButtons props={this.state} />
        {state.lightning ? (
            <a href={state.lightning} onClick={(e) => Helpers.handleLightningLinkClick(e)}>
              ⚡ {t('tip_lightning')}
            </a>
        ) : (
          ''
        )}
        {this.renderWebSiteLink(state)}
      </>
    );
  }

  renderInfoLinks() {
    return (
      <>
        <ProfileFollowerLinks hexPub={this.state.hexPub} npub={this.state.npub} />
        <ProfileTrustLinks id={this.state.hexPub} />
      </>
    );
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
      profilePicture = html`<${Avatar}
        key="${this.state.npub}avatar"
        str=${this.state.npub}
        hidePicture=${true}
        width=${128}
      />`;
    }
    let rawDataJson = [] as any;
    const profileEvent = Events.db.findOne({
      kind: 0,
      pubkey: this.state.hexPub,
    });
    const followEvent = Events.db.findOne({
      kind: 3,
      pubkey: this.state.hexPub,
    });
    if (profileEvent) {
      delete profileEvent.$loki;
      rawDataJson.push(profileEvent);
    }
    if (followEvent) {
      delete followEvent.$loki;
      rawDataJson.push(followEvent);
    }
    rawDataJson = JSON.stringify(rawDataJson, null, 2);
    const loggedIn = this.state.loggedIn;
    // TODO: on Follow / Message btn click open login modal if not logged in
    return html`
      <div key="${this.state.hexPub}details">
        <div className="mb-2 mx-2 md:px-2 md:mx-0 flex flex-col gap-2">
          <div className="flex flex-row">
            <div className=${this.state.banner ? '-mt-20' : ''}>${profilePicture}</div>
            <div className="flex-1 justify-end flex">
              <div onClick=${() => !loggedIn && localState.get('showLoginModal').put(true)}>
                ${this.state.isMyProfile
                  ? html`<button
                      className="btn btn-sm btn-neutral"
                      onClick=${() => loggedIn && route('/profile/edit')}
                    >
                      ${t('edit_profile')}
                    <//>`
                  : html`
                      <${Follow} key=${`${this.state.hexPub}follow`} id=${this.state.hexPub} />
                      ${this.state.npub !==
                      'npub1wnwwcv0a8wx0m9stck34ajlwhzuua68ts8mw3kjvspn42dcfyjxs4n95l8'
                        ? html` <button
                            className="btn btn-neutral btn-sm"
                            onClick=${() => loggedIn && route(`/chat/${this.state.npub}`)}
                          >
                            ${t('send_message')}
                          <//>`
                        : ''}
                    `}
              </div>
              <div className="profile-actions">
                <${Dropdown}>
                  <${Copy}
                    className="btn btn-sm"
                    key=${`${this.state.hexPub}copyLink`}
                    text=${t('copy_link')}
                    title=${this.state.name}
                    copyStr=${window.location.href}
                  />
                  <${Copy}
                    className="btn btn-sm"
                    key=${`${this.state.hexPub}copyNpub`}
                    text=${t('copy_user_ID')}
                    title=${this.state.name}
                    copyStr=${this.state.npub}
                  />
                  <${Button}
                    className="btn btn-sm"
                    onClick=${() => this.setState({ showQR: !this.state.showQR })}
                    >${t('show_qr_code')}<//
                  >
                  <${Copy}
                    className="btn btn-sm"
                    key=${`${this.state.hexPub}copyData`}
                    text=${t('copy_raw_data')}
                    title=${this.state.name}
                    copyStr=${rawDataJson}
                  />
                  ${!this.state.isMyProfile && !Key.getPrivKey()
                    ? html`
                        <${Button} className="btn btn-sm" onClick=${(e) => this.viewAs(e)}>
                          ${t('view_as') + ' '}
                          <${Name} pub=${this.state.hexPub} hideBadge=${true} />
                        <//>
                      `
                    : ''}
                  ${this.state.isMyProfile
                    ? ''
                    : html`
                        <${Block} className="btn btn-sm" id=${this.state.hexPub} />
                        <${Report} className="btn btn-sm" id=${this.state.hexPub} />
                      `}
                <//>
              </div>
            </div>
          </div>
          <div className="profile-header-stuff">
            <div className="flex-1 profile-name">
              <span className="text-xl">
                <${Name} pub=${this.state.hexPub} />
              </span>
              ${this.state.nip05
                ? html`<br /><small className="text-iris-green"
                      >${this.state.nip05.replace(/^_@/, '')}</small
                    >`
                : ''}
            </div>
            <div>
              <div className="text-sm flex gap-4">
                <a href="/follows/${this.state.npub}">
                  <b>${this.state.followedUserCount}</b> ${t('following')}
                </a>
                <a href="/followers/${this.state.npub}">
                  <b>${this.state.followerCount}</b> ${t('followers')}
                </a>
              </div>
              ${SocialNetwork.isFollowing(this.state.hexPub, Key.getPubKey())
                ? html` <div><small>${t('follows_you')}</small></div> `
                : ''}
            </div>
            <div className="py-2">
              <p className="text-sm">${this.state.about}</p>
              ${this.renderLinks()}
            </div>
          </div>
        </div>
        ${this.state.showQR
          ? html`
              <${QRModal}
                pub=${this.state.hexPub}
                onClose=${() => this.setState({ showQR: false })}
              />
            `
          : ''}
      </div>
    `;
  }

  renderTabs() {
    const currentProfileUrl = window.location.pathname.split('/')[1];
    const path = window.location.pathname;

    const linkClass = (href) =>
      path === href ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-neutral';

    return (
      <div className="flex mx-2 md:mx-0 gap-2 mb-4 overflow-x-scroll">
        <Link className={linkClass('/' + currentProfileUrl)} href={'/' + currentProfileUrl}>
          {t('posts')}
          <Show when={this.state.noPosts}>{' (0)'}</Show>
        </Link>
        <Link
          className={linkClass('/' + currentProfileUrl + '/replies')}
          href={'/' + currentProfileUrl + '/replies'}
        >
          {t('posts')} & {t('replies')}
          <Show when={this.state.noReplies}>{' (0)'}</Show>
        </Link>
        <Link
          className={linkClass('/' + currentProfileUrl + '/likes')}
          href={'/' + currentProfileUrl + '/likes'}
        >
          {t('likes')}
          <Show when={this.state.noLikes}>{' (0)'}</Show>
        </Link>
      </div>
    );
  }

  renderTab() {
    if (!this.state.hexPub) {
      return <div></div>;
    }

    if (this.props.tab === 'replies') {
      return (
        <Feed
          key={`replies${this.state.hexPub}`}
          index="postsAndReplies"
          nostrUser={this.state.hexPub}
        />
      );
    } else if (this.props.tab === 'likes') {
      return <Feed key={`likes${this.state.hexPub}`} index="likes" nostrUser={this.state.hexPub} />;
    } else if (this.props.tab === 'media') {
      return <div>TODO media message feed</div>;
    }

    return (
      <div>
        {this.getNotification()}
        <Feed key={`posts${this.state.hexPub}`} index="posts" nostrUser={this.state.hexPub} />
      </div>
    );
  }

  renderView() {
    const { hexPub, display_name, name, profile, banner, picture, blocked } = this.state;

    if (!hexPub) {
      return <div></div>;
    }
    const title = this.state.display_name || this.state.name || 'Profile';
    const ogTitle = `${title} | Dpeep`;
    const description = `Latest posts by ${this.state.display_name || this.state.name || 'user'}. ${
      this.state.profile?.about || ''
    }`;

    return (
      <>
        <Show when={banner}>
          <div
            className="mb-2 h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner})` }}
          ></div>
        </Show>
        <div>
          <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:type" content="profile" />
            <Show when={picture}>
              <meta property="og:image" content={picture} />
              <meta name="twitter:image" content={picture} />
            </Show>
            <meta property="og:title" content={ogTitle} />
            <meta property="og:description" content={description} />
          </Helmet>
          <ProfileCard />
          <Show when={!blocked}>
            {this.renderTabs()}
            {this.renderTab()}
          </Show>
        </div>
      </>
    );
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
    const unsub = profileManager.getProfile(
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
              newUrl = 'iris';
            } else {
              newUrl = nip05User;
            }
          } else {
            if (nip05User === '_') {
              newUrl = nip05Domain;
            } else {
              newUrl = nip05;
            }
          }
          this.setState({ nostrAddress: newUrl });
          // replace part before first slash with new url
          newUrl = window.location.pathname.replace(/[^/]+/, newUrl);
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

        // profile may contain arbitrary fields, so be careful what you pass to setState
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

  loadProfile(hexPub: string, nostrAddress?: string) {
    const isMyProfile = hexPub === Key.getPubKey();
    localState.get('isMyProfile').put(isMyProfile);
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
    localState.get('isMyProfile').put(false);
  }

  componentDidUpdate(_prevProps, prevState) {
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
    localState.get('loggedIn').on(this.inject());
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
            this.setState({ npub, hexPub: pubKey });
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
