import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { Event } from 'nostr-tools';

import EventDB from '@/nostr/EventDB.ts';
import Filter from '@/nostr/Filter.ts';
import PubSub from '@/nostr/PubSub.ts';

interface SubscribeOptions {
  filter: Filter;
  filterFn?: (event: Event) => boolean;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}

const useSubscribe = (ops: SubscribeOptions) => {
  const defaultOps = useMemo(
    () => ({
      enabled: true,
      sinceLastOpened: false,
      mergeSubscriptions: true,
    }),
    [],
  );

  const {
    filter,
    filterFn,
    enabled = defaultOps.enabled,
    sinceLastOpened = defaultOps.sinceLastOpened,
    mergeSubscriptions = defaultOps.mergeSubscriptions,
  } = ops;

  const [events, setEvents] = useState<Event[]>([]);
  const lastUntilRef = useRef<number | null>(null);

  const updateEvents = useCallback(() => {
    // maybe we should still add filter by displaycount?
    let e = EventDB.findArray({ ...filter, limit: undefined });
    if (filterFn) {
      e = e.filter(filterFn);
    }
    setEvents(e);
  }, [filter, filterFn]);

  useEffect(() => {
    setEvents([]);
    if (!enabled || !filter) return;
    return PubSub.subscribe(filter, updateEvents, sinceLastOpened, mergeSubscriptions);
  }, [filter, filterFn, enabled, sinceLastOpened, mergeSubscriptions]);

  const loadMoreCleanupRef = useRef<null | (() => void)>(null);

  const loadMore = useCallback(
    throttle(() => {
      const until = events.length ? events[events.length - 1].created_at : undefined;

      if (!until || lastUntilRef.current === until) return;

      lastUntilRef.current = until;
      const newFilter = { ...filter, until, limit: 100 };

      console.log('loadMore until', until && new Date(until * 1000));

      const cleanup = PubSub.subscribe(newFilter, updateEvents, false, false);

      loadMoreCleanupRef.current = cleanup;
    }, 500),
    [filter, filterFn, enabled, sinceLastOpened, mergeSubscriptions],
  );

  // New effect for cleaning up the loadMore subscription
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
