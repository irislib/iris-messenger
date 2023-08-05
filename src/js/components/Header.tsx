import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Cog8ToothIcon, HeartIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon, HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { Link, route } from 'preact-router';

import Component from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import Relays from '../nostr/Relays';
import { translate as t } from '../translations/Translation.mjs';

import Show from './helpers/Show';
import Name from './user/Name';
import SearchBox from './SearchBox';

declare global {
  interface Window {
    feed_selector_modal: any;
  }
}

export default class Header extends Component {
  userId = null as string | null;
  iv = null as any;

  constructor() {
    super();
    this.state = { latest: {} };
    this.escFunction = this.escFunction.bind(this);
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      this.state.showMobileSearch && this.setState({ showMobileSearch: false });
    }
  }

  backButtonClicked() {
    window.history.back();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.iv && clearInterval(this.iv);
    document.removeEventListener('keydown', this.escFunction, false);
  }

  setTitle(activeRoute: string) {
    let title: any = activeRoute.split('/')[1] || t('follows');
    if (title.startsWith('note')) {
      title = t('post');
    } else if (title.startsWith('npub')) {
      this.userId = title;
      title = <Name key={`${this.userId}title`} pub={this.userId || ''} />;
    } else {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');

    if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
      this.userId = replaced.length < activeRoute.length ? replaced : null;
      if (activeRoute.indexOf('/chat/') === 0 && this.userId === Key.getPubKey()) {
        title = (
          <>
            <b className="mr-5">📝</b> <b>{t('note_to_self')}</b>
          </>
        );
      } else {
        title = <Name key={`${this.userId}title`} pub={this.userId || ''} />;
      }
    }

    if (activeRoute.indexOf('/search/') === 0) {
      let searchTerm = activeRoute.replace('/search/', '');
      if (searchTerm.indexOf('?') !== -1) {
        searchTerm = searchTerm.substring(0, searchTerm.indexOf('?'));
      }
      title = `${t('search')}: ${decodeURIComponent(searchTerm)}`;
    }

    this.setState({ title });
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
    localState.get('showParticipants').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('unseenNotificationCount').on(this.inject());
    localState.get('showConnectedRelays').on(this.inject());
    localState.get('isMyProfile').on(this.inject());
    localState.get('activeRoute').on(
      this.sub((activeRoute) => {
        this.setState({
          about: null,
          activeRoute,
          showMobileSearch: false,
        });
        this.setTitle(activeRoute);
      }),
    );
    this.updateRelayCount();
    this.iv = setInterval(() => this.updateRelayCount(), 1000);
  }

  onTitleClicked() {
    window.scrollTo(0, 0);
    if (this.userId && this.userId.indexOf('hashtag') === -1) {
      route('/' + this.userId);
    }
  }

  updateRelayCount() {
    this.setState({ connectedRelays: Relays.getConnectedRelayCount() });
  }

  renderSearchBox() {
    return !this.userId ? <SearchBox onSelect={(item) => route(`/${item.key}`)} /> : '';
  }

  renderConnectedRelays() {
    return (
      <a
        href="/settings/network"
        className={`ml-2 tooltip tooltip-bottom mobile-search-hidden ${
          this.state.showMobileSearch ? 'hidden-xs' : ''
        } ${this.state.connectedRelays > 0 ? 'connected' : ''}`}
        data-tip={t('connected_relays')}
      >
        <small className="flex items-center gap-2">
          <span class="icon">{Icons.network}</span>
          <span>{this.state.connectedRelays}</span>
        </small>
      </a>
    );
  }

  renderTitle() {
    const r = this.state.activeRoute;
    const isFeed = ['/', '/global'].includes(r);
    return (
      <div
        className={`flex flex-1 items-center justify-center`}
        onClick={() => this.onTitleClicked()}
      >
        {this.state.title}
        <Show when={isFeed}>
          <button
            className="ml-2 focus:outline-none rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              window.feed_selector_modal.showModal();
            }}
          >
            <ChevronDownIcon width={20} />
          </button>
          <dialog id="feed_selector_modal" className="modal focus:outline-none">
            <ul className="p-2 shadow menu bg-base-100 rounded-box w-52 border-2 border-neutral-900 gap-2">
              <li>
                <Link className={r === '/' ? 'active' : ''} href="/">
                  {t('follows')}
                </Link>
              </li>
              <li>
                <Link className={r === '/global' ? 'active' : ''} href="/global">
                  {t('global_feed')}
                </Link>
              </li>
            </ul>
          </dialog>
        </Show>
      </div>
    );
  }

  renderNotifications() {
    return (
      <>
        <Show when={this.state.isMyProfile}>
          <Link href="/settings" className="md:hidden">
            <Cog8ToothIcon width={28} />
          </Link>
        </Show>
        <a
          href="/notifications"
          className={`relative inline-block ${this.state.isMyProfile ? 'hidden md:flex' : ''}`}
        >
          {this.state.activeRoute === '/notifications' ? (
            <HeartIconFull width={28} />
          ) : (
            <HeartIcon width={28} />
          )}
          <Show when={this.state.unseenNotificationCount}>
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-iris-purple text-white text-sm rounded-full h-5 w-5 flex items-center justify-center">
              {this.state.unseenNotificationCount > 99 ? '' : this.state.unseenNotificationCount}
            </span>
          </Show>
        </a>
      </>
    );
  }

  renderLoginBtns() {
    return (
      <div className="flex gap-2">
        <button
          className="btn btn-sm btn-primary"
          onClick={() => localState.get('showLoginModal').put(true)}
        >
          {t('log_in')}
        </button>
        <button
          className="btn btn-sm btn-neutral"
          onClick={() => localState.get('showLoginModal').put(true)}
        >
          {t('sign_up')}
        </button>
      </div>
    );
  }

  renderBackBtnOrLogo() {
    const isHome = this.state.activeRoute === '/';
    return isHome ? (
      <div className="flex flex-row items-center gap-2 md:hidden">
        <img src="/img/icon128.png" width="30" height="30" />
        <h1 className=" text-3xl">iris</h1>
      </div>
    ) : (
      <ArrowLeftIcon width={24} onClick={() => this.backButtonClicked()} />
    );
  }

  render() {
    const pub = Key.getPubKey();
    const loggedIn = !!pub;
    return (
      <div className="sticky top-0 z-10 cursor-pointer flex flex-wrap">
        <div className="w-full overflow-x-hidden bg-black md:bg-opacity-50 md:shadow-lg md:backdrop-blur-lg px-2">
          <div className="flex items-center justify-between h-12">
            {this.renderBackBtnOrLogo()}
            <Show when={loggedIn && this.state.showConnectedRelays}>
              {this.renderConnectedRelays()}
            </Show>
            {this.renderTitle()}
            <Show when={loggedIn}>{this.renderNotifications()}</Show>
            <Show when={!loggedIn}>{this.renderLoginBtns()}</Show>
          </div>
        </div>
      </div>
    );
  }
}
