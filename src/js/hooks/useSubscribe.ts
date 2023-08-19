import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { Event } from 'nostr-tools';

import Filter from '@/nostr/Filter';
import PubSub from '@/nostr/PubSub';
import SortedMap from '@/utils/SortedMap';

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

  const sortedEvents = useRef(new SortedMap<string, Event>());
  const [events, setEvents] = useState<Event[]>([]);
  const lastUntilRef = useRef<number | null>(null);

  const addEventToSortedEvents = (event: Event, shouldUpdateState = true) => {
    if (sortedEvents.current.has(event.id)) return;

    if (filterFn && !filterFn(event)) return;

    if (filter.keywords && !filter.keywords.some((keyword) => event.content?.includes(keyword)))
      return;

    sortedEvents.current.set(event.created_at + event.id, event);
    if (shouldUpdateState) {
      const newEvents = [...sortedEvents.current.values()].reverse();
      if (events.length !== newEvents.length) {
        setEvents(newEvents);
      }
    }
  };

  useEffect(() => {
    setEvents([]);
    sortedEvents.current = new SortedMap<string, Event>();
  }, [filter, filterFn, enabled, sinceLastOpened, mergeSubscriptions]);

  useEffect(() => {
    if (!enabled || !filter) return;
    return PubSub.subscribe(filter, addEventToSortedEvents, sinceLastOpened, mergeSubscriptions);
  }, [filter, filterFn, enabled, sinceLastOpened, mergeSubscriptions]);

  const loadMoreCleanupRef = useRef<null | (() => void)>(null);

  const loadMore = useCallback(
    throttle(() => {
      const until = sortedEvents.current.first()?.[1].created_at;

      if (!until || lastUntilRef.current === until) return;

      lastUntilRef.current = until;
      const newFilter = { ...filter, until, limit: 100 };

      console.log('loadMore until', until && new Date(until * 1000));

      const cleanup = PubSub.subscribe(newFilter, addEventToSortedEvents, false, false);

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
