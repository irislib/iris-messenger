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
  PaperAirplaneIcon as PaperAirplaneIconFull,
} from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import logo from '../../../public/img/icon128.png';
import BaseComponent from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation.mjs';

import { Button, PrimaryButton } from './buttons/Button';
import Modal from './modal/Modal';
import QRModal from './modal/QRModal';
import PublicMessageForm from './PublicMessageForm';

const APPLICATIONS = [
  { url: '/', text: 'home', icon: HomeIcon, activeIcon: HomeIconFull },
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
    showQrModal: false,
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

  renderQrModal = () =>
    this.state.showQrModal ? (
      <QRModal pub={Key.getPubKey()} onClose={() => this.setState({ showQrModal: false })} />
    ) : (
      ''
    );

  render() {
    return (
      <div class="application-list">
        <a
          tabIndex={3}
          href="/"
          onClick={(e) => this.menuLinkClicked(e, undefined, true)}
          class="logo"
        >
          <img src={logo} width="30" height="30" />
          <span style="font-size: 1.8em">iris</span>
        </a>
        {APPLICATIONS.map((a: any) => {
          if (a.url && (!a.beta || this.state.showBetaFeatures)) {
            let isActive = this.state.activeRoute.startsWith(a.url);
            if (a.url === '/') {
              isActive = this.state.activeRoute.length <= 1;
            }
            const Icon = isActive ? a.activeIcon : a.icon;
            return (
              <a
                onClick={(e) => this.menuLinkClicked(e, a)}
                className={isActive ? 'active' : ''}
                href={a.url}
              >
                <span class="icon">
                  {a.text === 'messages' && this.state.unseenMsgsTotal ? (
                    <span class="unseen unseen-total">{this.state.unseenMsgsTotal}</span>
                  ) : (
                    ''
                  )}
                  <Icon width={24} />
                </span>
                <span class="text">{t(a.text)}</span>
              </a>
            );
          }
        })}
        <div class="menu-new-post">
          <PrimaryButton
            onClick={() => this.setState({ showNewPostModal: !this.state.showNewPostModal })}
          >
            <span class="icon">{Icons.post}</span>
          </PrimaryButton>
          <Button onClick={() => this.setState({ showQrModal: !this.state.showQrModal })}>
            <span class="icon">{Icons.QRcode}</span>
          </Button>
          {this.renderNewPostModal()} {this.renderQrModal()}
        </div>
      </div>
    );
  }
}
