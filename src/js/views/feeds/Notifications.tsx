import React, { useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { Event } from 'nostr-tools';

import EventDB from '@/nostr/EventDB';
import Events from '@/nostr/Events';
import Key from '@/nostr/Key';
import publicState from '@/state/PublicState.ts';
import { RouteProps } from '@/views/types.ts';
import View from '@/views/View.tsx';

import Feed from '../../components/feed/Feed';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';

const Notifications: React.FC<RouteProps> = () => {
  const filter = { kinds: [1, 6, 7, 9735], '#p': [Key.getPubKey()], limit: 20 };
  const filterOptions = useMemo(
    () => [
      {
        name: 'notifications',
        filter,
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
            // TODO this gets triggered only once per Iris session?
            const time = Math.floor(Date.now() / 1000);
            console.log('set state');
            publicState.get('notifications').get('lastOpened').put(time);
            // TODO if user rejected, stop pestering them with sign prompt
            localState.get('unseenNotificationCount').put(0);
          }
        }, true);
      }, 1000),
    [],
  );

  useEffect(() => {
    updateNotificationsLastOpened();
  }, [updateNotificationsLastOpened]);

  return (
    <View>
      <Feed
        key="notifications"
        showDisplayAs={false}
        emptyMessage={t('no_notifications_yet')}
        filterOptions={filterOptions}
        fetchEvents={fetchEvents}
      />
    </View>
  );
};

export default Notifications;
