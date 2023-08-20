import { route } from 'preact-router';

import BaseComponent from '@/BaseComponent.ts';
import SimpleImageModal from '@/components/modal/Image.tsx';
import { getEventReplyingTo } from '@/nostr/utils.ts';
import ProfileHelmet from '@/views/profile/Helmet.tsx';

import Feed from '../../components/feed/Feed.tsx';
import Show from '../../components/helpers/Show.tsx';
import { isSafeOrigin } from '../../components/SafeImg.tsx';
import ProfileCard from '../../components/user/ProfileCard.tsx';
import localState from '../../LocalState.ts';
import Key from '../../nostr/Key.ts';
import SocialNetwork from '../../nostr/SocialNetwork.ts';
import { translate as t } from '../../translations/Translation.mjs';
import View from '../View.tsx';

class Profile extends BaseComponent {
  subscriptions: any[];
  unsub: any;
  state = {
    hexPub: '',
    npub: '',
    name: '',
    display_name: '',
    profile: {} as any,
    banner: '',
    fullBanner: '',
    picture: '',
    website: '',
    lightning: '',
    blocked: false,
    bannerModalOpen: false,
    notFound: false,
  };

  constructor() {
    super();
    this.subscriptions = [];
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
          <ProfileHelmet
            title={title}
            description={description}
            picture={picture}
            ogTitle={ogTitle}
          />
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
