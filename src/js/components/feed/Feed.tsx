import { useCallback, useEffect, useRef, useState } from 'react';

import EventComponent from '@/components/events/EventComponent';
import DisplaySelector from '@/components/feed/DisplaySelector';
import FilterOptionsSelector from '@/components/feed/FilterOptionsSelector';
import ImageGrid from '@/components/feed/ImageGrid';
import ShowNewEvents from '@/components/feed/ShowNewEvents';
import { DisplayAs, FeedProps } from '@/components/feed/types';
import InfiniteScroll from '@/components/helpers/InfiniteScroll';
import Show from '@/components/helpers/Show';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';
import Key from '@/nostr/Key';
import Helpers from '@/utils/Helpers';

import { translate as t } from '../../translations/Translation.mjs';

const Feed = (props: FeedProps) => {
  const fetchEvents = props.fetchEvents || useSubscribe;
  const feedTopRef = useRef<HTMLDivElement>(null);
  const { showDisplayAs, filterOptions, emptyMessage } = props;
  if (!filterOptions || filterOptions.length === 0) {
    throw new Error('Feed requires at least one filter option');
  }
  const displayAsParam = Helpers.getUrlParameter('display') === 'grid' ? 'grid' : 'feed';
  const [filterOption, setFilterOption] = useState(filterOptions[0]);
  const [displayAs, setDisplayAs] = useState<DisplayAs>(displayAsParam);
  const [mutedUsers] = useLocalState('muted', {});
  const [showUntil, setShowUntil] = useState(Math.floor(Date.now() / 1000));
  const [infiniteScrollKey, setInfiniteScrollKey] = useState(0);

  useEffect(() => {
    setShowUntil(Math.floor(Date.now() / 1000));
  }, [filterOption, displayAs]);

  const filterFn = useCallback(
    (event) => {
      if (mutedUsers[event.pubkey]) {
        return false;
      }
      if (filterOption.filterFn) {
        return filterOption.filterFn(event);
      }
      return true;
    },
    [mutedUsers, filterOption],
  );

  // when giving params to Feed, be careful that they don't unnecessarily change on every render
  const { events, loadMore } = fetchEvents({
    filter: filterOption.filter,
    filterFn,
    sinceLastOpened: false,
    mergeSubscriptions: false,
  });

  if (events.length && events[0].pubkey === Key.getPubKey() && events[0].created_at > showUntil) {
    setShowUntil(Math.floor(Date.now() / 1000));
  }

  const hasNewEvents = events.length && events[0].created_at > showUntil;

  const isEmpty = events.length === 0;

  const infiniteScrollKeyString = `${infiniteScrollKey}-${displayAs}-${filterOption.name}`;

  return (
    <>
      <Show when={hasNewEvents}>
        <ShowNewEvents
          onClick={() => {
            if (feedTopRef.current) {
              const currentScrollTop =
                document.documentElement.scrollTop || document.body.scrollTop;

              // only scroll up
              if (currentScrollTop > feedTopRef.current.offsetTop) {
                feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }
            setInfiniteScrollKey(infiniteScrollKey + 1);
            setShowUntil(Math.floor(Date.now() / 1000));
          }}
        />
      </Show>
      <div ref={feedTopRef} />
      <Show when={filterOptions.length > 1}>
        <FilterOptionsSelector
          filterOptions={filterOptions}
          activeOption={filterOption}
          onOptionClick={(opt) => {
            setFilterOption(opt);
          }}
        />
      </Show>
      <Show when={showDisplayAs !== false}>
        <DisplaySelector
          onDisplayChange={(displayAs) => {
            setDisplayAs(displayAs);
            Helpers.setUrlParameter('display', displayAs === 'grid' ? 'grid' : null);
          }}
          activeDisplay={displayAs}
        />
      </Show>
      <Show when={isEmpty}>
        <div className="m-2 md:mx-4">{emptyMessage || t('no_posts_yet')}</div>
      </Show>
      <Show when={displayAs === 'grid'}>
        <ImageGrid key={infiniteScrollKeyString} events={events} loadMore={loadMore} />
      </Show>
      <Show when={displayAs === 'feed'}>
        <InfiniteScroll key={`${infiniteScrollKeyString}feed`} loadMore={loadMore}>
          {events.map((event) => {
            // is this inefficient? should we rather pass a component function + list of events?
            if (event.created_at > showUntil) {
              return null;
            }
            return (
              <EventComponent key={`${event.id}EC`} id={event.id} {...filterOption.eventProps} />
            );
          })}
        </InfiniteScroll>
      </Show>
    </>
  );
};

export default Feed;
