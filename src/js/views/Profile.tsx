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

class Profile extends View {
  followedUsers: Set<string>;
  followers: Set<string>;
  subscriptions: any[];
  unsub: any;

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
  }

  async viewAs(event) {
    event.preventDefault();
    route('/');
    Key.login({ rpub: this.state.hexPub });
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

    const title = display_name || name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${display_name || name || 'user'}. ${
      profile?.about || ''
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
    fetch(`https://eu.rbr.bio/${address}/info.json`).then((res) => {
      if (!res.ok) {
        return;
      }
      res.json().then((json) => {
        if (json) {
          this.setState({
            followerCount: json.followerCount || this.state.followerCount,
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
    setTimeout(() => {
      this.subscriptions.push(SocialNetwork.getFollowersByUser(address, setFollowCounts));
      this.subscriptions.push(SocialNetwork.getFollowedByUser(address, setFollowCounts));
    }, 1000); // this causes social graph recursive loading, so let some other stuff like feed load first
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
