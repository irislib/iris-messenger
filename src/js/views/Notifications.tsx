import { debounce } from 'lodash';

import Feed from '../components/feed/Feed';
import localState from '../LocalState';
import Session from '../nostr/Session';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';

export default class Notifications extends View {
  class = 'public-messages-view';

  updateNotificationsLastOpened = debounce(() => {
    const node = localState.get('settings').get('notifications').get('saveLastOpened');
    node.once((saveLastOpened) => {
      if (saveLastOpened !== false) {
        const time = Math.floor(Date.now() / 1000);
        const success = Session.public?.set('notifications/lastOpened', time);
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
    return (
      <div class="centered-container">
        <Feed
          scrollElement={this.scrollElement.current}
          key="notifications"
          index="notifications"
          emptyMessage={t('no_notifications_yet')}
        />
      </div>
    );
  }
}
