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
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';

class Profile extends View {
  subscriptions: any[];
  unsub: any;

  constructor() {
    super();
    this.state = {
      followedUserCount: 0,
      followerCount: 0,
    };
    this.id = 'profile';
    this.subscriptions = [];
  }

  getNotification() {
    if (this.state.noFollowers /* && this.followers.has(Key.getPubKey()) */) {
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
      <div className="flex mx-4 gap-2 mb-4 overflow-x-auto">
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
          key={`posts${this.state.hexPub}`}
          filterOptions={[
            { name: 'likes', filter: { authors: [this.state.hexPub], kinds: [1], limit: 5 } },
          ]}
        />
      );
    } else if (this.props.tab === 'likes') {
      return (
        <Feed
          key={`likes${this.state.hexPub}`}
          filterOptions={[
            { name: 'likes', filter: { authors: [this.state.hexPub], kinds: [7], limit: 5 } },
          ]}
        />
      );
    } else if (this.props.tab === 'media') {
      return <div>TODO media message feed</div>;
    }

    return (
      <div>
        {this.getNotification()}
        <Feed
          key={`posts${this.state.hexPub}`}
          filterOptions={[
            { name: 'likes', filter: { authors: [this.state.hexPub], kinds: [1], limit: 5 } },
          ]}
        />
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
            className="mb-4 h-48 bg-cover bg-center"
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
          <ProfileCard npub={this.state.npub} hexPub={this.state.hexPub} />
          <Show when={!blocked}>
            {this.renderTabs()}
            {this.renderTab()}
          </Show>
        </div>
      </>
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

  loadProfile(hexPub: string) {
    const isMyProfile = hexPub === Key.getPubKey();
    localState.get('isMyProfile').put(isMyProfile);
    localState.get('noFollowers').on(this.inject());
    this.subscriptions.push(
      SocialNetwork.getProfile(hexPub, (profile) => {
        let banner;

        try {
          banner = profile.banner && new URL(profile.banner).toString();
          if (!banner) {
            return;
          }
          banner = isSafeOrigin(banner)
            ? banner
            : `https://imgproxy.iris.to/insecure/plain/${banner}`;
          this.setState({ banner });
        } catch (e) {
          console.log('Invalid banner URL', profile.banner);
        }
      }),
    );
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
            this.loadProfile(pubKey);
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
