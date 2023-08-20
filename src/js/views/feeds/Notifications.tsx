import React, { useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { Event } from 'nostr-tools';

import EventDB from '@/nostr/EventDB';
import Events from '@/nostr/Events';
import Key from '@/nostr/Key';
import { RouteProps } from '@/views/types.ts';

import Feed from '../../components/feed/Feed';
import localState from '../../LocalState';
import Session from '../../nostr/Session';
import { translate as t } from '../../translations/Translation.mjs';

const Notifications: React.FC<RouteProps> = () => {
  const filterOptions = useMemo(
    () => [
      {
        name: 'notifications',
        filter: { kinds: [1, 6, 7, 9735], '#p': [Key.getPubKey()], limit: 20 },
        eventProps: { fullWidth: false },
      },
    ],
    [],
  );

  const fetchEvents = () => {
    const events = Events.notifications.eventIds
      .map((id) => EventDB.get(id))
      .filter((event): event is Event => Boolean(event)) as Event[];

    return {
      events,
      loadMore: () => {},
    };
  };

  const updateNotificationsLastOpened = useMemo(
    () =>
      debounce(() => {
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
      }, 1000),
    [],
  );

  useEffect(() => {
    updateNotificationsLastOpened();
  }, [updateNotificationsLastOpened]);

  return (
    <Feed
      key="notifications"
      showDisplayAs={false}
      emptyMessage={t('no_notifications_yet')}
      filterOptions={filterOptions}
      fetchEvents={fetchEvents}
    />
  );
};

export default Notifications;
