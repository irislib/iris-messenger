import { memo, useMemo, useRef, useState } from 'react';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import EventComponent from '@/components/events/EventComponent';
import DisplaySelector from '@/components/feed/DisplaySelector';
import FilterOptionsSelector from '@/components/feed/FilterOptionsSelector';
import ImageGridItem from '@/components/feed/ImageGridItem';
import ImageModal from '@/components/feed/ImageModal';
import ShowNewEvents from '@/components/feed/ShowNewEvents';
import { DisplayAs, FeedProps, ImageOrVideo } from '@/components/feed/types';
import InfiniteScroll from '@/components/helpers/InfiniteScroll.tsx';
import Show from '@/components/helpers/Show';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';

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
  const [displayAs, setDisplayAs] = useState<DisplayAs>('feed');
  const [modalItemIndex, setModalImageIndex] = useState<number | null>(null);
  const [mutedUsers] = useLocalState('muted', {});
  const [hasNewEvents, setHasNewEvents] = useState(false);

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

  const isEmpty = allEventsFiltered.length === 0;

  const imagesAndVideos = useMemo(() => {
    if (displayAs === 'feed') {
      return [];
    }
    return mapEventsToMedia(allEventsFiltered);
  }, [allEventsFiltered, displayAs]) as ImageOrVideo[];

  return (
    <>
      <Show when={hasNewEvents}>
        <ShowNewEvents
          onClick={() => {
            setHasNewEvents(false);
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
          }}
        />
      </Show>
      <Show when={showDisplayAs !== false}>
        <DisplaySelector
          onDisplayChange={(displayAs) => {
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
          <InfiniteScroll loadMore={loadMore}>
            {imagesAndVideos.map((item, index) => (
              <ImageGridItem item={item} index={index} setModalImageIndex={setModalImageIndex} />
            ))}
          </InfiniteScroll>
        </div>
      </Show>
      <Show when={displayAs === 'feed'}>
        <InfiniteScroll loadMore={loadMore}>
          {allEventsFiltered.map((event) => {
            return <EventComponent id={event.id} {...filterOption.eventProps} />;
          })}
        </InfiniteScroll>
      </Show>
    </>
  );
};

export default memo(Feed);
