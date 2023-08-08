import { useEffect, useState } from 'react';
import { Event, Filter } from 'nostr-tools';

import PubSub from '@/nostr/PubSub';
import SortedEventMap from '@/utils/SortedEventMap';

const useSubscribe = (ops: {
  filter: Filter;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}) => {
  const [sortedEvents] = useState(new SortedEventMap());
  const { filter, enabled = true, sinceLastOpened = false, mergeSubscriptions = true } = ops;
  const [events, setEvents] = useState<Event[]>([]);
  // TODO save into SortedMap

  useEffect(() => {
    if (!enabled || !filter) return;
    filter.limit = filter.limit || 10;
    return PubSub.subscribe(
      filter,
      (event: any) => {
        if (sortedEvents.has(event.id)) return;
        sortedEvents.add(event);
        setEvents(sortedEvents.events());
      },
      sinceLastOpened,
      mergeSubscriptions,
    );
  }, [ops]);

  const loadMore = () => {
    // TODO
  };

  return { events, loadMore };
};

export default useSubscribe;
