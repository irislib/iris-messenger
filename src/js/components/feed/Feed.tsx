import { memo, useEffect, useMemo, useRef, useState } from 'react';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import EventComponent from '@/components/events/EventComponent';
import DisplaySelector from '@/components/feed/DisplaySelector';
import FilterOptionsSelector from '@/components/feed/FilterOptionsSelector';
import ImageGridItem from '@/components/feed/ImageGridItem';
import ImageModal from '@/components/feed/ImageModal';
import ShowNewEvents from '@/components/feed/ShowNewEvents';
import { DisplayAs, FeedProps, ImageOrVideo } from '@/components/feed/types';
import useInfiniteScroll from '@/components/feed/useInfiniteScroll';
import Show from '@/components/helpers/Show';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';

const PAGE_SIZE = 6;

function mapEventsToMedia(events: any[]): ImageOrVideo[] {
  return events.flatMap((event) => {
    const imageMatches = (event.content.match(Image.regex) || []).map((url: string) => ({
      type: 'image',
      url,
      created_at: event.created_at,
    }));
    const videoMatches = (event.content.match(Video.regex) || []).map((url: string) => ({
      type: 'video',
      url,
      created_at: event.created_at,
    }));
    return [...imageMatches, ...videoMatches];
  });
}

const Feed = (props: FeedProps) => {
  const feedTopRef = useRef<HTMLDivElement>(null);
  const { showDisplayAs, filterOptions, emptyMessage } = props;
  if (!filterOptions || filterOptions.length === 0) {
    throw new Error('Feed requires at least one filter option');
  }
  const [filterOption, setFilterOption] = useState(filterOptions[0]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [displayAs, setDisplayAs] = useState<DisplayAs>('feed');
  const [modalItemIndex, setModalImageIndex] = useState<number | null>(null);
  const lastElementRef = useRef(null);
  const [mutedUsers] = useLocalState('muted', {});
  const [hasNewEvents, setHasNewEvents] = useState(false);
  const [listedEvents, setListedEvents] = useState<any[]>([]);

  const { events: allEvents, loadMore } = useSubscribe({
    filter: filterOption.filter,
    sinceLastOpened: false,
  });

  const allEventsFiltered = useMemo(() => {
    const filtered = allEvents.filter((event) => {
      if (mutedUsers[event.pubkey]) {
        return false;
      }
      if (filterOption.filterFn) {
        return filterOption.filterFn(event);
      }
      return true;
    });
    return filtered;
  }, [allEvents, filterOption]);

  useEffect(() => {
    if (listedEvents.length < 10) {
      setListedEvents(allEventsFiltered);
    } else {
      const lastShownEvent = listedEvents[Math.min(displayCount, listedEvents.length) - 1];
      const oldEvents = allEventsFiltered.filter(
        (event) => event.created_at < lastShownEvent.created_at,
      );
      setListedEvents((prevListedEvents) => [...prevListedEvents, ...oldEvents]);
      setHasNewEvents(true);
    }
  }, [allEventsFiltered]);

  const isEmpty = listedEvents.length === 0;

  const hasMoreItems = displayCount < listedEvents.length;
  useInfiniteScroll(lastElementRef, loadMoreItems, hasMoreItems);

  function loadMoreItems() {
    if (displayCount < listedEvents.length) {
      setDisplayCount((prevCount) => prevCount + PAGE_SIZE);
    } else {
      loadMore?.();
    }
  }

  const imagesAndVideos = useMemo(() => {
    if (displayAs === 'feed') {
      return [];
    }
    return mapEventsToMedia(listedEvents).slice(0, displayCount);
  }, [listedEvents, displayCount, displayAs]) as ImageOrVideo[];

  return (
    <>
      <Show when={hasNewEvents}>
        <ShowNewEvents
          onClick={() => {
            setHasNewEvents(false);
            setDisplayCount(PAGE_SIZE);
            setListedEvents(allEventsFiltered);
            if (feedTopRef.current) {
              feedTopRef.current.scrollIntoView({ behavior: 'smooth' });
            }
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
            setDisplayCount(PAGE_SIZE);
          }}
        />
      </Show>
      <Show when={showDisplayAs !== false}>
        <DisplaySelector
          onDisplayChange={(displayAs) => {
            setDisplayCount(PAGE_SIZE);
            setDisplayAs(displayAs);
          }}
          activeDisplay={displayAs}
        />
      </Show>
      <ImageModal
        setModalImageIndex={setModalImageIndex}
        modalItemIndex={modalItemIndex}
        imagesAndVideos={imagesAndVideos}
      />
      <Show when={isEmpty}>{emptyMessage || 'No Posts'}</Show>
      <Show when={displayAs === 'grid'}>
        <div className="grid grid-cols-3 gap-px">
          {imagesAndVideos.map((item, index) => (
            <ImageGridItem
              item={item}
              index={index}
              setModalImageIndex={setModalImageIndex}
              lastElementRef={lastElementRef}
              imagesAndVideosLength={imagesAndVideos.length}
            />
          ))}
        </div>
      </Show>
      <Show when={displayAs === 'feed'}>
        {listedEvents.slice(0, displayCount).map((event, index, self) => {
          const isLastElement = index === self.length - 1;
          return (
            <div key={`feed${event.id}${index}`} ref={isLastElement ? lastElementRef : null}>
              <EventComponent id={event.id} {...filterOption.eventProps} />
            </div>
          );
        })}
      </Show>
    </>
  );
};

export default memo(Feed);
