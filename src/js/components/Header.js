import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import Identicon from './Identicon';
import Name from './Name';
import SearchBox from './SearchBox';

class Header extends Component {
  constructor() {
    super();
    this.state = { latest: {} };
    this.chatId = null;
    this.escFunction = this.escFunction.bind(this);
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      this.state.showMobileSearch && this.setState({ showMobileSearch: false });
    }
  }

  getOnlineStatusText() {
    const channel = this.chatId && iris.private(this.chatId);
    const activity = channel.activity;
    if (activity) {
      if (activity.isActive) {
        return t('online');
      } else if (activity.lastActive) {
        const d = new Date(activity.lastActive);
        let lastSeenText = t(
          iris.util.getDaySeparatorText(d, d.toLocaleDateString({ dateStyle: 'short' })),
        );
        if (lastSeenText === t('today')) {
          lastSeenText = iris.util.formatTime(d);
        } else {
          lastSeenText = iris.util.formatDate(d);
        }
        return `${t('last_active')} ${lastSeenText}`;
      }
    }
  }

  backButtonClicked() {
    route('/chat');
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    clearInterval(this.iv);
    document.removeEventListener('keydown', this.escFunction, false);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
    iris.local().get('showParticipants').on(this.inject());
    iris.local().get('unseenMsgsTotal').on(this.inject());
    iris.local().get('unseenNotificationCount').on(this.inject());
    iris
      .local()
      .get('activeRoute')
      .on(
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
            iris.local().get('channels').get(this.chatId).get('isTyping').on(this.inject());
            iris
              .local()
              .get('channels')
              .get(this.chatId)
              .get('theirLastActiveTime')
              .on(this.inject());
          }

          if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
            if (
              activeRoute.indexOf('/chat/') === 0 &&
              iris.session.getKey() &&
              this.chatId === iris.session.getKey().pub
            ) {
              const title = html`<b style="margin-right:5px">📝</b> <b>${t('note_to_self')}</b>`;
              this.setState({ title });
            } else {
              const title = html`<${Name} key=${this.chatId} pub=${this.chatId} />`;
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
    iris.local().get('toggleMenu').put(true);
  }

  updateRelayCount() {
    this.setState({ connectedRelays: Nostr.getConnectedRelayCount() });
  }

  render() {
    const key = iris.session.getKey();
    if (!key) {
      return;
    }
    const npub = Nostr.toNostrBech32Address(key.secp256k1.rpub, 'npub');
    const activeRoute = this.state.activeRoute;
    const chat =
      activeRoute && activeRoute.indexOf('/chat') === 0 && this.chatId && iris.private(this.chatId);
    const isTyping = chat && chat.isTyping;
    const onlineStatus =
      chat &&
      chat.uuid &&
      activeRoute &&
      activeRoute.length > 20 &&
      !isTyping &&
      this.getOnlineStatusText();
    const searchBox = this.chatId
      ? ''
      : html`
          <${SearchBox}
            onSelect=${(item) => route(item.uuid ? `/chat/${item.uuid}` : `/${item.key}`)}
          />
        `;
    const chatting = activeRoute && activeRoute.indexOf('/chat/') === 0;

    return html` <header class="nav header">
      ${activeRoute && activeRoute.indexOf('/chat/') === 0
        ? html`
            <div
              id="back-button"
              class="visible-xs-inline-block"
              onClick=${() => this.backButtonClicked()}
            >
              ‹
            </div>
          `
        : ''}
      <div class="header-content">
        <div class="mobile-search-hidden ${this.state.showMobileSearch ? 'hidden-xs' : ''}">
          ${Helpers.isElectron || chatting
            ? ''
            : html`
                <a href="/" onClick=${(e) => this.onLogoClick(e)} class="visible-xs-flex logo">
                  <div class="mobile-menu-icon">${Icons.menu}</div>
                </a>
              `}
        </div>
        ${chatting
          ? ''
          : html`
              <a
                class="mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}"
                href=""
                onClick=${(e) => {
                  e.preventDefault();
                  this.setState({ showMobileSearch: false });
                }}
              >
                <span class="visible-xs-inline-block">${Icons.backArrow}</span>
              </a>
            `}
        <a
          href="/settings/nostr"
          class="connected-peers tooltip mobile-search-hidden ${this.state.showMobileSearch
            ? 'hidden-xs'
            : ''} ${this.state.connectedRelays ? 'connected' : ''}"
        >
          <span class="tooltiptext right">${t('connected_relays')}</span>
          <small>
            <span class="icon">${Icons.network}</span>
            <span>${this.state.connectedRelays}</span>
          </small>
        </a>
        <div
          class="text"
          style=${this.chatId ? 'cursor:pointer;text-align:center' : ''}
          onClick=${() => this.onTitleClicked()}
        >
          ${this.state.title && chatting ? html` <div class="name">${this.state.title}</div> ` : ''}
          ${isTyping ? html`<small class="typing-indicator">${t('typing')}</small>` : ''}
          ${this.state.about ? html`<small class="participants">${this.state.about}</small>` : ''}
          ${this.chatId ? html`<small class="last-seen">${onlineStatus || ''}</small>` : ''}
          ${chatting
            ? ''
            : html`
                <div
                  id="mobile-search"
                  class="mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}"
                >
                  ${searchBox}
                </div>
                <div
                  id="mobile-search-btn"
                  class="mobile-search-hidden ${this.state.showMobileSearch
                    ? 'hidden'
                    : 'visible-xs-inline-block'}"
                  onClick=${() => {
                    // also synchronously make element visible so it can be focused
                    $('.mobile-search-visible').removeClass('hidden-xs hidden');
                    $('.mobile-search-hidden')
                      .removeClass('visible-xs-inline-block')
                      .addClass('hidden');
                    const input = document.querySelector('.search-box input');
                    input && input.focus();
                    this.setState({ showMobileSearch: true });
                  }}
                >
                  ${Icons.search}
                </div>
              `}
        </div>

        <!--${chat && this.chatId !== npub && !chat.uuid
          ? html`
              <a
                class="tooltip"
                style="width:24px; height:24px; color: var(--msg-form-button-color)"
                id="<start-video-call"
                onClick=${() => iris.local().get('outgoingCall').put(this.chatId)}
              >
                <span class="tooltiptext">${t('video_call')}</span>
                ${Icons.videoCall}
              </a>
              <!-- <a id="start-voice-call" style="width:20px; height:20px; margin-right: 20px">
            Icons.voiceCall
            </a> -->
            `
          : ''}-->
        ${this.chatId && this.chatId.length > 10 && this.chatId.length < 40
          ? html`
              <a
                class="tooltip hidden-xs"
                onClick=${() =>
                  iris.local().get('showParticipants').put(!this.state.showParticipants)}
              >
                <span class="tooltiptext">${t('participant_list')}</span>
                ${Icons.group}
              </a>
            `
          : ''}
        <${Link}
          activeClassName="active"
          href="/notifications"
          class="notifications-button mobile-search-hidden ${this.state.showMobileSearch
            ? 'hidden'
            : ''}"
        >
          ${this.state.activeRoute === '/notifications' ? Icons.heartFull : Icons.heartEmpty}
          ${this.state.unseenNotificationCount
            ? html`
                <span class="unseen"
                  >${this.state.unseenNotificationCount > 99
                    ? ''
                    : this.state.unseenNotificationCount}</span
                >
              `
            : ''}
        <//>

        <${Link}
          activeClassName="active"
          href="/${npub}"
          onClick=${() => iris.local().get('scrollUp').put(true)}
          class="hidden-xs my-profile"
        >
          <${Identicon} str=${npub} width="34" />
        <//>
      </div>
    </header>`;
  }
}

export default Header;
