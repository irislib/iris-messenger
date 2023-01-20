import { html } from 'htm/preact';
import iris from 'iris-lib';
import $ from 'jquery';
import ScrollViewport from 'preact-scroll-viewport';

import Component from '../../BaseComponent';
import Helpers from '../../Helpers';
import Nostr from '../../Nostr';
import { translate as t } from '../../translations/Translation';

import ChatListItem from './ChatListItem';

class ChatList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chats: new Map(),
      sortedChats: [],
    };
  }

  enableDesktopNotifications() {
    if (window.Notification) {
      Notification.requestPermission(() => {
        if (Notification.permission === 'granted' || Notification.permission === 'denied') {
          $('#enable-notifications-prompt').slideUp();
        }
        if (Notification.permission === 'granted') {
          iris.notifications.subscribeToWebPush();
        }
      });
    }
  }

  componentDidMount() {
    Nostr.getDirectMessages((chats) => {
      const sortedChats = Array.from(chats.keys()).sort((a, b) => {
        const aEventIds = chats.get(a).eventIds;
        const bEventIds = chats.get(b).eventIds;
        const aLatestEvent = aEventIds.length ? Nostr.eventsById.get(aEventIds[0]) : null;
        const bLatestEvent = bEventIds.length ? Nostr.eventsById.get(bEventIds[0]) : null;
        if (bLatestEvent.created_at > aLatestEvent.created_at) {
          return 1;
        } else if (bLatestEvent.created_at < aLatestEvent.created_at) {
          return -1;
        }
        return 0;
      });
      this.setState({ chats, sortedChats });
    });
    iris
      .local()
      .get('scrollUp')
      .on(this.sub(() => Helpers.animateScrollTop('.chat-list')));

    if (
      window.Notification &&
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      /*
      setTimeout(() => {
        $('#enable-notifications-prompt').slideDown();
      }, 5000);
       */
    }
  }

  render() {
    const activeChat = this.props.activeChat;

    return html`<section class="sidebar ${this.props.class || ''}">
      <div id="enable-notifications-prompt" onClick=${() =>
        iris.notifications.enableDesktopNotifications()}>
        <div class="title">${t('get_notified_new_messages')}</div>
        <div><a>${t('turn_on_desktop_notifications')}</a></div>
      </div>
      <div class="chat-list">
        <${ScrollViewport}>
          ${this.state.sortedChats.map(
            (pubkey) =>
              html`<${ChatListItem}
                active=${pubkey === activeChat}
                key=${pubkey}
                chat=${pubkey}
                latestMsgId=${this.state.chats.get(pubkey).eventIds[0]}
              />`,
          )}
        </${ScrollViewport}>
      </div>
    </section>`;
  }
}

export default ChatList;
