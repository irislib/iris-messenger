import { Helmet } from 'react-helmet';
import { PureComponent } from 'preact/compat';
import { route } from 'preact-router';

import SimpleImageModal from '@/components/modal/Image.tsx';
import { getEventReplyingTo } from '@/nostr/utils.ts';

import Copy from '../../components/buttons/Copy.tsx';
import Feed from '../../components/feed/Feed.tsx';
import Show from '../../components/helpers/Show.tsx';
import { isSafeOrigin } from '../../components/SafeImg.tsx';
import ProfileCard from '../../components/user/ProfileCard.tsx';
import localState from '../../LocalState.ts';
import Key from '../../nostr/Key.ts';
import SocialNetwork from '../../nostr/SocialNetwork.ts';
import { translate as t } from '../../translations/Translation.mjs';
import Helpers from '../../utils/Helpers.tsx';
import View from '../View.tsx';

type Props = {
  id: string;
};

type State = {
  hexPub: string;
  npub: string;
  name: string;
  display_name: string;
  profile: any;
  banner: string;
  fullBanner: string;
  picture: string;
  website: string;
  lightning: string;
  blocked: boolean;
  bannerModalOpen: boolean;
  noFollowers: boolean;
  notFound: boolean;
  followedUserCount: number;
  followerCount: number;
};

class Profile extends PureComponent<Props, State> {
  subscriptions: any[];
  unsub: any;

  constructor() {
    super();
    this.state = {
      followedUserCount: 0,
      followerCount: 0,
      bannerModalOpen: false,
    };
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

  render() {
    const {
      hexPub,
      display_name,
      name,
      profile,
      banner,
      picture,
      blocked,
      bannerModalOpen,
      fullBanner,
    } = this.state;

    if (!hexPub) {
      return <div></div>;
    }

    const title = display_name || name || 'Profile';
    const ogTitle = `${title} | Iris`;
    const description = `Latest posts by ${display_name || name || 'user'}. ${
      profile?.about || ''
    }`;
    const setBannerModalOpen = (bannerModalOpen) => this.setState({ bannerModalOpen });

    return (
      <View>
        <Show when={banner}>
          <div
            className="mb-4 h-48 bg-cover bg-center cursor-pointer"
            style={{ backgroundImage: `url(${banner})` }}
            onClick={() => setBannerModalOpen(true)}
          ></div>
          <Show when={bannerModalOpen}>
            <SimpleImageModal imageUrl={fullBanner} onClose={() => setBannerModalOpen(false)} />
          </Show>
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
            <Feed
              key={`posts${this.state.hexPub}`}
              filterOptions={[
                {
                  name: t('posts'),
                  filter: { authors: [this.state.hexPub], kinds: [1, 6], limit: 10 },
                  filterFn: (event) => !getEventReplyingTo(event),
                  eventProps: { showRepliedMsg: true },
                },
                {
                  name: t('posts_and_replies'),
                  filter: { authors: [this.state.hexPub], kinds: [1, 6], limit: 5 },
                  eventProps: { showRepliedMsg: true, fullWidth: false },
                },
                {
                  name: t('likes'),
                  filter: { authors: [this.state.hexPub], kinds: [7], limit: 5 },
                },
              ]}
            />
          </Show>
        </div>
      </View>
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
    //localState.get('noFollowers').on(this.inject());
    this.subscriptions.push(
      SocialNetwork.getProfile(hexPub, (profile) => {
        let banner, fullBanner;

        try {
          banner = profile.banner && new URL(profile.banner).toString();
          if (!banner) {
            return;
          }
          fullBanner = banner;
          banner = isSafeOrigin(banner)
            ? banner
            : `https://imgproxy.iris.to/insecure/rs:fit:948:948/plain/${banner}`;
          this.setState({ banner, fullBanner });
        } catch (e) {
          console.log('Invalid banner URL', profile.banner);
        }
      }),
    );
  }

  componentDidMount() {
    const pub = this.props.id;
    const npub = Key.toNostrBech32Address(pub, 'npub');
    //localState.get('loggedIn').on(this.inject());
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
