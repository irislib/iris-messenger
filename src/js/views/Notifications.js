import { html } from 'htm/preact';
import { debounce } from 'lodash';
import { createRef } from 'preact';

import MessageFeed from '../components/MessageFeed';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Session from '../nostr/Session';
import { translate as t } from '../translations/Translation';

import View from './View';

export default class Notifications extends View {
  class = 'public-messages-view';
  ref = createRef();

  updateNotificationsLastOpened = debounce(() => {
    const time = Math.floor(Date.now() / 1000);
    Session.public.set('notifications/lastOpened', time);
    localState.get('unseenNotificationCount').put(0);
  }, 1000);

  componentDidMount() {
    this.restoreScrollPosition();
    Events.getNotifications((notifications) => {
      const hasNotifications = notifications.length > 0;
      if (hasNotifications && this.ref.current) {
        this.updateNotificationsLastOpened();
      }
      this.setState({ hasNotifications });
    });
  }

  renderView() {
    return html`
      <div ref=${this.ref} class="centered-container">
        ${this.state.hasNotifications
          ? html``
          : html`<p class="mobile-padding15">${t('no_notifications_yet')}</p> `}
        <${MessageFeed}
          scrollElement=${this.scrollElement.current}
          key="notifications"
          index="notifications"
        />
      </div>
    `;
  }
}
