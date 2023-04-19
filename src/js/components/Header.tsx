import $ from 'jquery';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import Relays from '../nostr/Relays';
import { translate as t } from '../translations/Translation';

import Identicon from './Identicon';
import Name from './Name';
import SearchBox from './SearchBox';

export default class Header extends Component {
  chatId = null;
  iv = null;

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
    clearInterval(this.iv);
    document.removeEventListener('keydown', this.escFunction, false);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
    localState.get('showParticipants').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('unseenNotificationCount').on(this.inject());
    localState.get('activeRoute').on(
      this.sub((activeRoute) => {
        this.setState({
          about: null,
          title: '',
          activeRoute,
          showMobileSearch: false,
        });
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        this.chatId = replaced.length < activeRoute.length ? replaced : null;
        if (this.chatId) {
          localState.get('channels').get(this.chatId).get('isTyping').on(this.inject());
          localState.get('channels').get(this.chatId).get('theirLastActiveTime').on(this.inject());
        }

        if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
          if (activeRoute.indexOf('/chat/') === 0 && this.chatId === Key.getPubKey()) {
            const title = (
              <>
                <b style="margin-right:5px">📝</b> <b>{t('note_to_self')}</b>
              </>
            );
            this.setState({ title });
          } else {
            const title = <Name key={this.chatId} pub={this.chatId} />;
            this.setState({ title });
          }
        }
      }),
    );
    this.updateRelayCount();
    this.iv = setInterval(() => this.updateRelayCount(), 1000);
  }

  onTitleClicked() {
    if (this.chatId && this.chatId.indexOf('hashtag') === -1) {
      const view = this.chatId.length < 40 ? '/group/' : '/';
      route(view + this.chatId);
    }
  }

  onLogoClick(e) {
    e.preventDefault();
    e.stopPropagation();
    $('a.logo').blur();
    $(window).width() > 625 && route('/');
    localState.get('toggleMenu').put(true);
  }

  updateRelayCount() {
    this.setState({ connectedRelays: Relays.getConnectedRelayCount() });
  }

  render() {
    const key = Key.getPubKey();
    const npub = Key.toNostrBech32Address(key, 'npub');
    const activeRoute = this.state.activeRoute;
    const chat = null;
    const isTyping = chat && chat.isTyping;

    const onlineStatus = '';
    const searchBox = this.chatId ? '' : <SearchBox onSelect={(item) => route(`/${item.key}`)} />;
    const chatting = activeRoute && activeRoute.indexOf('/chat/') === 0;

    return (
      <header class="nav header">
        {activeRoute && activeRoute.indexOf('/chat/') === 0 ? (
          <div
            id="back-button"
            class="visible-xs-inline-block"
            onClick={() => this.backButtonClicked()}
          >
            {Icons.backArrow}
          </div>
        ) : (
          ''
        )}
        <div class="header-content">
          <div class={`mobile-search-hidden ${this.state.showMobileSearch ? 'hidden-xs' : ''}`}>
            {Helpers.isElectron || chatting ? (
              ''
            ) : (
              <a href="/" onClick={(e) => this.onLogoClick(e)} class="visible-xs-flex logo">
                <div class="mobile-menu-icon">{Icons.menu}</div>
              </a>
            )}
          </div>
          {chatting ? (
            ''
          ) : (
            <a
              class={`mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}`}
              href=""
              onClick={(e) => {
                e.preventDefault();
                this.setState({ showMobileSearch: false });
              }}
            >
              <span class="visible-xs-inline-block">{Icons.backArrow}</span>
            </a>
          )}
          {this.state.connectedRelays ? (
            ''
          ) : (
            <a
              href="/settings/network"
              class={`connected-peers tooltip mobile-search-hidden ${
                this.state.showMobileSearch ? 'hidden-xs' : ''
              }`}
            >
              <span class="tooltiptext right">{t('connected_relays')}</span>
              <small>
                <span class="icon">{Icons.network}</span>
                <span>{this.state.connectedRelays}</span>
              </small>
            </a>
          )}
          <div
            class="text"
            style={this.chatId ? 'cursor:pointer;text-align:center' : ''}
            onClick={() => this.onTitleClicked()}
          >
            {this.state.title && chatting ? <div class="name">{this.state.title}</div> : ''}
            {isTyping ? <small class="typing-indicator">{t('typing')}</small> : ''}
            {this.state.about ? <small class="participants">{this.state.about}</small> : ''}
            {this.chatId ? <small class="last-seen">{onlineStatus || ''}</small> : ''}
            {chatting ? (
              ''
            ) : (
              <div
                id="mobile-search"
                class={`mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}`}
              >
                {searchBox}
              </div>
            )}
            {chatting ? (
              ''
            ) : (
              <div
                id="mobile-search-btn"
                class={`mobile-search-hidden ${
                  this.state.showMobileSearch ? 'hidden' : 'visible-xs-inline-block'
                }`}
                onClick={() => {
                  // also synchronously make element visible so it can be focused
                  $('.mobile-search-visible').removeClass('hidden-xs hidden');
                  $('.mobile-search-hidden')
                    .removeClass('visible-xs-inline-block')
                    .addClass('hidden');
                  const input = document.querySelector('.search-box input');
                  input && $(input).focus();
                  this.setState({ showMobileSearch: true });
                }}
              >
                {Icons.search}
              </div>
            )}
          </div>

          <Link
            activeClassName="active"
            href={`/${npub}`}
            onClick={() => localState.get('scrollUp').put(true)}
            class="hidden-xs my-profile"
          >
            <Identicon str={npub} width={34} />
          </Link>
        </div>
      </header>
    );
  }
}
