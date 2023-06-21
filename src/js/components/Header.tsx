import { HeartIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon, HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import Component from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import Relays from '../nostr/Relays';
import { translate as t } from '../translations/Translation.mjs';

import Name from './Name';
import SearchBox from './SearchBox';

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
    let title: any = activeRoute.split('/')[1] || t('home');
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

    this.setState({ title });
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
    localState.get('showParticipants').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('unseenNotificationCount').on(this.inject());
    localState.get('showConnectedRelays').on(this.inject());
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
        class={`connected-peers tooltip mobile-search-hidden ${
          this.state.showMobileSearch ? 'hidden-xs' : ''
        } ${this.state.connectedRelays > 0 ? 'connected' : ''}`}
      >
        <span class="tooltiptext right">{t('connected_relays')}</span>
        <small>
          <span class="icon">{Icons.network}</span>
          <span>{this.state.connectedRelays}</span>
        </small>
      </a>
    );
  }

  renderTitle() {
    return (
      <div class="flex-1 text-center" onClick={() => this.onTitleClicked()}>
        {this.state.title}
      </div>
    );
  }

  renderNotifications() {
    return (
      <a
        href="/notifications"
        class={`notifications-button mobile-search-hidden ${
          this.state.showMobileSearch ? 'hidden' : ''
        }`}
      >
        {this.state.activeRoute === '/notifications' ? (
          <HeartIconFull width={28} />
        ) : (
          <HeartIcon width={28} />
        )}
        {this.state.unseenNotificationCount ? (
          <span class="unseen">
            {this.state.unseenNotificationCount > 99 ? '' : this.state.unseenNotificationCount}
          </span>
        ) : (
          ''
        )}
      </a>
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

  render() {
    const loggedIn = !!Key.getPubKey();
    return (
      <div className="sticky top-0 z-10 cursor-pointer">
        <div className="w-full bg-black md:bg-opacity-50 md:shadow-lg md:backdrop-blur-lg px-2 py-3">
          <div className="flex items-center">
            <ArrowLeftIcon width={24} onClick={() => this.backButtonClicked()} />
            {loggedIn && this.state.showConnectedRelays && this.renderConnectedRelays()}
            {this.renderTitle()}
            {loggedIn && this.renderNotifications()}
            {!loggedIn && this.renderLoginBtns()}
          </div>
        </div>
      </div>
    );
  }
}
