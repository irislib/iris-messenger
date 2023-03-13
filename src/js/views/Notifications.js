import { html } from 'htm/preact';
import { debounce } from 'lodash';
import { createRef } from 'preact';

import Feed from '../components/Feed';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Session from '../nostr/Session';
import { translate as t } from '../translations/Translation';

import View from './View';

export default class Notifications extends View {
  class = 'public-messages-view';
  ref = createRef();

  updateNotificationsLastOpened = debounce(() => {
    const node = localState.get('settings').get('notifications').get('saveLastOpened');
    node.once((saveLastOpened) => {
      if (saveLastOpened !== false) {
        const time = Math.floor(Date.now() / 1000);
        const success = Session.public.set('notifications/lastOpened', time);
        if (!success) {
          console.log('user rejected');
          // stop pestering if user rejects signature request
          node.put(false);
        }
        localState.get('unseenNotificationCount').put(0);
      }
    });
  }, 1000);

  componentDidMount() {
    this.restoreScrollPosition();
    this.updateNotificationsLastOpened();
  }

  renderView() {
    return html`
      <div ref=${this.ref} class="centered-container">
        <${Feed}
          scrollElement=${this.scrollElement.current}
          key="notifications"
          index="notifications"
          emptyMessage=${t('no_notifications_yet')}
        />
      </div>
    `;
  }
}
