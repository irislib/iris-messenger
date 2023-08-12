import { useCallback, useEffect, useRef, useState } from 'react';
import { Event, Filter } from 'nostr-tools';

import PubSub, { Unsubscribe } from '@/nostr/PubSub';
import SortedEventMap from '@/utils/SortedEventMap';

const useSubscribe = (ops: {
  filter: Filter;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}) => {
  const sortedEvents = useRef(new SortedEventMap());
  const [loadMoreUnsubscribe, setLoadMoreUnsubscribe] = useState<Unsubscribe | null>(null);

  const { filter, enabled = true, sinceLastOpened = false, mergeSubscriptions = true } = ops;

  const [events, setEvents] = useState<Event[]>([]);
  const lastUntilRef = useRef<number | null>(null);

  const handleEvent = (event: Event) => {
    if (sortedEvents.current.has(event.id)) return;
    sortedEvents.current.add(event);
    setEvents(sortedEvents.current.events());
  };

  useEffect(() => {
    sortedEvents.current = new SortedEventMap();
  }, [filter]);

  useEffect(() => {
    if (!enabled || !filter) return;

    const newFilter = { ...filter, limit: filter.limit || 100 };

    return PubSub.subscribe(newFilter, handleEvent, sinceLastOpened, mergeSubscriptions);
  }, [filter, enabled, sinceLastOpened, mergeSubscriptions]);

  const loadMore = useCallback(() => {
    const until = sortedEvents.current.last()?.created_at;
    console.log('loadMore', until && new Date(until * 1000).toISOString());

    if (!until || lastUntilRef.current === until) return;

    lastUntilRef.current = until;

    if (loadMoreUnsubscribe) {
      loadMoreUnsubscribe();
      setLoadMoreUnsubscribe(null);
    }

    const newFilter = { ...filter, until, limit: 100 };
    console.log('load more until', new Date(until * 1000), 'filter', newFilter);

    const unsubscribe = PubSub.subscribe(newFilter, handleEvent, false, false);
    setLoadMoreUnsubscribe(unsubscribe);
  }, [sortedEvents, filter, loadMoreUnsubscribe]);

  return { events, loadMore };
};

export default useSubscribe;
