import { useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { Event, Filter } from 'nostr-tools';

import EventDB from '@/nostr/EventDB.ts';
import PubSub from '@/nostr/PubSub.ts';

interface SubscribeOptions {
  filter: Filter;
  filterFn?: (event: Event) => boolean;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}

const useSubscribe = (ops: SubscribeOptions) => {
  const {
    filter,
    filterFn,
    enabled = true,
    sinceLastOpened = false,
    mergeSubscriptions = true,
  } = ops;

  const shouldReturnEarly = !enabled || filter.limit === 0;

  const getEvents = useCallback(() => {
    if (shouldReturnEarly) return [];
    let e = EventDB.findArray({ ...filter, limit: undefined });
    if (filterFn) {
      e = e.filter(filterFn);
    }
    return e;
  }, [filter, filterFn, shouldReturnEarly]);

  const [events, setEvents] = useState<Event[]>(getEvents());
  const lastUntilRef = useRef<number | null>(null);
  const loadMoreCleanupRef = useRef<null | (() => void)>(null);

  const updateEvents = useCallback(() => {
    setEvents(getEvents());
  }, [getEvents]);

  useEffect(() => {
    setEvents([]);
    if (shouldReturnEarly) return;
    return PubSub.subscribe(filter, updateEvents, sinceLastOpened, mergeSubscriptions);
  }, [filter, filterFn, shouldReturnEarly, sinceLastOpened, mergeSubscriptions]);

  const loadMore = useCallback(
    throttle(() => {
      if (shouldReturnEarly) return;

      const until = events.length ? events[events.length - 1].created_at : undefined;

      if (!until || lastUntilRef.current === until) return;

      lastUntilRef.current = until;
      const newFilter = { ...filter, until, limit: 100 };

      console.log('loadMore until', until && new Date(until * 1000));

      const cleanup = PubSub.subscribe(newFilter, updateEvents, false, false);

      loadMoreCleanupRef.current = cleanup;
    }, 500),
    [filter, filterFn, shouldReturnEarly, sinceLastOpened, mergeSubscriptions],
  );

  // Clean up the loadMore subscription
  useEffect(() => {
    return () => {
      if (loadMoreCleanupRef.current) {
        loadMoreCleanupRef.current();
      }
    };
  }, [loadMore]);

  return { events, loadMore };
};

export default useSubscribe;
