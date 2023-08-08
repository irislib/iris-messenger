import { useCallback, useEffect, useState } from 'react';
import { Event, Filter } from 'nostr-tools';

import PubSub, { Unsubscribe } from '@/nostr/PubSub';
import SortedEventMap from '@/utils/SortedEventMap';

const useSubscribe = (ops: {
  filter: Filter;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}) => {
  const [sortedEvents, setSortedEvents] = useState(new SortedEventMap());
  const [loadMoreUnsubscribe, setLoadMoreUnsubscribe] = useState<Unsubscribe | null>(null);
  const { filter, enabled = true, sinceLastOpened = false, mergeSubscriptions = true } = ops;
  const [events, setEvents] = useState<Event[]>([]);

  const handleEvent = (event: Event) => {
    if (sortedEvents.has(event.id)) return;
    sortedEvents.add(event);
    setEvents(sortedEvents.events());
  };

  useEffect(() => {
    setSortedEvents(new SortedEventMap());
  }, [filter]);

  useEffect(() => {
    if (!enabled || !filter) return;
    filter.limit = filter.limit || 10;
    return PubSub.subscribe(filter, handleEvent, sinceLastOpened, mergeSubscriptions);
  }, [ops]);

  // Using useCallback to memoize the loadMore function.
  const loadMore = useCallback(() => {
    const until = sortedEvents.last()?.created_at;
    if (!until) return;

    // If there's a previous subscription from loadMore, unsubscribe from it
    if (loadMoreUnsubscribe) {
      loadMoreUnsubscribe();
      setLoadMoreUnsubscribe(null); // Reset the stored unsubscribe function
    }

    const newFilter = Object.assign({}, filter, { until, limit: 50 });
    console.log('load more until', new Date(until * 1000), 'filter', newFilter);

    // Subscribe with the new filter and store the returned unsubscribe function
    const unsubscribe = PubSub.subscribe(newFilter, handleEvent, false, false);
    setLoadMoreUnsubscribe(unsubscribe);
  }, [filter, loadMoreUnsubscribe, sortedEvents]); // Dependencies for the useCallback

  return { events, loadMore };
};

export default useSubscribe;
