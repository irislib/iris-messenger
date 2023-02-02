import { html } from 'htm/preact';
import iris from 'iris-lib';
import { debounce } from 'lodash';
import { createRef } from 'preact';

import MessageFeed from '../components/MessageFeed';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import View from './View';

export default class Notifications extends View {
  class = 'public-messages-view';
  ref = createRef();

  updateNotificationsLastOpened = debounce(() => {
    const time = Math.floor(Date.now() / 1000);
    Nostr.public.set('notifications/lastOpened', time);
  }, 1000);

  componentDidMount() {
    this.restoreScrollPosition();
    Nostr.getNotifications((notifications) => {
      const hasNotifications = notifications.length > 0;
      if (hasNotifications && this.ref.current) {
        this.updateNotificationsLastOpened();
        iris.local().get('unseenNotificationCount').put(0);
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
