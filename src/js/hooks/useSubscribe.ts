import { useEffect, useRef, useState } from 'react';
import { throttle } from 'lodash';
import { Event, Filter } from 'nostr-tools';

import PubSub from '@/nostr/PubSub';
import SortedEventMap from '@/utils/SortedEventMap';

const useSubscribe = (ops: {
  filter: Filter;
  sinceLastOpened?: boolean;
  mergeSubscriptions?: boolean;
  enabled?: boolean;
}) => {
  const sortedEvents = useRef(new SortedEventMap());
  const [loadMoreFilter, setLoadMoreFilter] = useState<Filter | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const lastUntilRef = useRef<number | null>(null);

  const { filter, enabled = true, sinceLastOpened = false, mergeSubscriptions = true } = ops;

  const handleEvent = (event: Event) => {
    if (sortedEvents.current.has(event.id)) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (filter.keywords && !filter.keywords.some((keyword) => event.content?.includes(keyword))) {
      return;
    }
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

  useEffect(() => {
    if (!loadMoreFilter) return;

    return PubSub.subscribe(loadMoreFilter, handleEvent, false, false);
  }, [loadMoreFilter]);

  const loadMore = throttle(() => {
    const until = sortedEvents.current.last()?.created_at;

    if (!until || lastUntilRef.current === until) return;

    lastUntilRef.current = until;
    const newFilter = { ...filter, until, limit: 100 };
    setLoadMoreFilter(newFilter);
  }, 500);

  return { events, loadMore };
};

export default useSubscribe;
