import {
  Cog8ToothIcon,
  HomeIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  Cog8ToothIcon as Cog8ToothIconFull,
  HomeIcon as HomeIconFull,
  InformationCircleIcon as InformationCircleIconFull,
  MagnifyingGlassIcon,
  PaperAirplaneIcon as PaperAirplaneIconFull,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { Link, route } from 'preact-router';

import BaseComponent from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import Modal from './modal/Modal';
import Identicon from './Identicon';
import Name from './Name';
import PublicMessageForm from './PublicMessageForm';

const APPLICATIONS = [
  { url: '/', text: 'home', icon: HomeIcon, activeIcon: HomeIconFull },
  {
    url: '/search',
    text: 'search',
    icon: MagnifyingGlassIcon,
    activeIcon: Icons.magnifyingGlassBold,
  },
  {
    url: '/chat',
    text: 'messages',
    icon: PaperAirplaneIcon,
    activeIcon: PaperAirplaneIconFull,
  },
  {
    url: '/settings',
    text: 'settings',
    icon: Cog8ToothIcon,
    activeIcon: Cog8ToothIconFull,
  },
  {
    url: '/about',
    text: 'about',
    icon: InformationCircleIcon,
    activeIcon: InformationCircleIconFull,
  },
];

export default class Menu extends BaseComponent {
  state = {
    unseenMsgsTotal: 0,
    activeRoute: '',
    showBetaFeatures: false,
    showNewPostModal: false,
  };

  componentDidMount() {
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('activeRoute').on(this.inject());
  }

  menuLinkClicked = (e, a?, openFeed = false) => {
    if (a?.text === 'home' || openFeed) {
      this.openFeedClicked(e);
    }
    localState.get('toggleMenu').put(false);
    localState.get('scrollUp').put(true);
  };

  openFeedClicked = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localState.get('lastOpenedFeed').once((lastOpenedFeed: string) => {
      if (lastOpenedFeed !== this.state.activeRoute.replace('/', '')) {
        route('/' + (lastOpenedFeed || ''));
      } else {
        localState.get('lastOpenedFeed').put('');
        route('/');
      }
    });
  };

  renderNewPostModal = () =>
    this.state.showNewPostModal ? (
      <Modal
        centerVertically={true}
        showContainer={true}
        onClose={() => this.setState({ showNewPostModal: false })}
      >
        <PublicMessageForm
          onSubmit={() => this.setState({ showNewPostModal: false })}
          placeholder={t('whats_on_your_mind')}
          autofocus={true}
        />
      </Modal>
    ) : (
      ''
    );

  renderProfileLink = () => {
    const hex = Key.getPubKey();
    const npub = Key.toNostrBech32Address(hex, 'npub');
    return (
      <div>
        <Link href={`/${npub}`} className="btn btn-ghost md:max-lg:btn-circle">
          <Identicon str={npub} width={34} />
          <div className="hidden lg:block ml-2">
            <Name pub={hex} hideBadge={true} />
          </div>
        </Link>
      </div>
    );
  };

  render() {
    return (
      <div className="sticky top-0 z-20 h-screen max-h-screen hidden md:w-16 lg:w-56 flex-col px-2 py-4 md:flex flex-shrink-0">
        <a
          className="flex items-center gap-3 px-2 mb-4"
          tabIndex={3}
          href="/"
          onClick={(e) => this.menuLinkClicked(e, undefined, true)}
        >
          <img src="/img/dwotr/logo30.png" style="padding-top:5px" />
          <h1 className="hidden lg:flex text-3xl">Dpeep</h1>
        </a>
        <a href="https://github.com/DigitalTrustProtocol/DWoTR-Documentation/blob/main/Trust.md" target="_blank"><small className="pl-3">Iris clone with DWoTR</small></a>
        {APPLICATIONS.map((a: any) => {
          if (a.url && (!a.beta || this.state.showBetaFeatures)) {
            let isActive = this.state.activeRoute.startsWith(a.url);
            if (a.url === '/') {
              isActive = this.state.activeRoute.length <= 1;
            }
            const Icon = isActive ? a.activeIcon : a.icon;
            return (
              <div>
                <a
                  onClick={(e) => this.menuLinkClicked(e, a)}
                  className={`${
                    isActive ? 'active' : ''
                  } inline-flex w-auto flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-neutral-900`}
                  href={a.url}
                >
                  {a.text === 'messages' && this.state.unseenMsgsTotal ? (
                    <span class="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
                  ) : (
                    ''
                  )}
                  <Icon width={24} />
                  <span className="hidden lg:flex">{t(a.text)}</span>
                </a>
              </div>
            );
          }
        })}
        <hr className="-mx-2 opacity-10 my-2" />
        <div class="py-2">
          <button
            className="btn btn-primary md:max-lg:btn-circle"
            onClick={() => this.setState({ showNewPostModal: !this.state.showNewPostModal })}
          >
            <PlusIcon width={24} />
            <span className="hidden lg:flex">{t('new_post')}</span>
          </button>
          {this.renderNewPostModal()}
        </div>
        <hr className="-mx-2 opacity-10 my-2" />
        {this.renderProfileLink()}
      </div>
    );
  }
}
