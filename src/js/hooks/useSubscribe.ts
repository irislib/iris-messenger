import { useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import { Event } from 'nostr-tools';

import Filter from '@/nostr/Filter';
import PubSub from '@/nostr/PubSub';
import SortedMap from '@/utils/SortedMap.tsx';

const useSubscribe = (ops: {
  filter: Filter;
  filterFn?: (event: Event) => boolean;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}) => {
  const sortedEvents = useRef(new SortedMap<string, Event>('created_at'));
  const [loadMoreFilter, setLoadMoreFilter] = useState<Filter | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const lastUntilRef = useRef<number | null>(null);

  const {
    filter,
    filterFn,
    enabled = true,
    sinceLastOpened = false,
    mergeSubscriptions = true,
  } = ops;

  const handleEvent = (event: Event) => {
    if (sortedEvents.current.has(event.id)) return;
    if (filterFn && !filterFn(event)) return;
    if (filter.keywords && !filter.keywords.some((keyword) => event.content?.includes(keyword))) {
      return;
    }
    sortedEvents.current.set(event.id, event);
    setEvents([...sortedEvents.current.values()].reverse());
  };

  useEffect(() => {
    sortedEvents.current = new SortedMap<string, Event>();
  }, [filter, filterFn]);

  useEffect(() => {
    if (!enabled || !filter) return;

    const newFilter = { ...filter, limit: filter.limit || 100 };

    return PubSub.subscribe(newFilter, handleEvent, sinceLastOpened, mergeSubscriptions);
  }, [filter, filterFn, enabled, sinceLastOpened, mergeSubscriptions]);

  useEffect(() => {
    if (!loadMoreFilter) return;

    return PubSub.subscribe(loadMoreFilter, handleEvent, false, false);
  }, [loadMoreFilter]);

  const loadMore = throttle(() => {
    const until = sortedEvents.current.last()?.value.created_at;

    if (!until || lastUntilRef.current === until) return;

    lastUntilRef.current = until;
    const newFilter = { ...filter, until, limit: 100 };
    setLoadMoreFilter(newFilter);
  }, 500);

  return { events, loadMore };
};

export default useSubscribe;
