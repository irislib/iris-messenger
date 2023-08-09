import { memo, useMemo, useRef, useState } from 'react';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import EventComponent from '@/components/events/EventComponent';
import DisplaySelector from '@/components/feed/DisplaySelector';
import FilterOptionsSelector from '@/components/feed/FilterOptionsSelector';
import ImageGridItem from '@/components/feed/ImageGridItem';
import ImageModal from '@/components/feed/ImageModal';
import { DisplayAs, FeedProps, ImageOrVideo } from '@/components/feed/types';
import useInfiniteScroll from '@/components/feed/useInfiniteScroll';
import Show from '@/components/helpers/Show';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';

const PAGE_SIZE = 6;

const Feed = (props: FeedProps) => {
  const { showDisplayAs, filterOptions, emptyMessage } = props;
  if (!filterOptions || filterOptions.length === 0) {
    throw new Error('Feed requires at least one filter option');
  }
  const [filterOption, setFilterOption] = useState(filterOptions[0]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [displayAs, setDisplayAs] = useState('feed' as DisplayAs);
  const [modalItemIndex, setModalImageIndex] = useState(null as number | null);
  const lastElementRef = useRef(null);
  const [mutedUsers] = useLocalState('muted', {});

  const { events: allEvents, loadMore } = useSubscribe({
    filter: filterOption.filter,
    sinceLastOpened: false,
  });

  const events = useMemo(() => {
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

  const isEmpty = events.length === 0;

  const hasMoreItems = displayCount < events.length;
  useInfiniteScroll(lastElementRef, loadMoreItems, hasMoreItems);

  function loadMoreItems() {
    if (displayCount < events.length) {
      setDisplayCount((prevCount) => prevCount + PAGE_SIZE);
    } else {
      loadMore?.();
    }
  }

  function mapEventsToMedia(events) {
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

  const imagesAndVideos = useMemo(() => {
    if (displayAs === 'feed') {
      return [];
    }
    return mapEventsToMedia(events).slice(0, displayCount);
  }, [events, displayCount, displayAs]) as ImageOrVideo[];

  return (
    <>
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
      <Show when={showDisplayAs}>
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
        {events.slice(0, displayCount).map((event, index, self) => {
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
