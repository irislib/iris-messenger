import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Bars3Icon, Squares2X2Icon } from '@heroicons/react/24/outline';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import EventComponent from '@/components/events/EventComponent';
import ImageGridItem from '@/components/feed/ImageGridItem';
import ImageModal from '@/components/feed/ImageModal';
import { DisplayAs, FeedProps, ImageOrVideo } from '@/components/feed/types';
import Show from '@/components/helpers/Show';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';

const PAGE_SIZE = 6;
const LOAD_MORE_MARGIN = '0px 0px 2000px 0px';

const Feed = ({ showDisplayAs, filterOptions, emptyMessage }: FeedProps) => {
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

  // deduplicate
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

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        if (displayCount < events.length) {
          setDisplayCount((prevCount) => prevCount + PAGE_SIZE);
        } else {
          loadMore?.();
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.0,
      rootMargin: LOAD_MORE_MARGIN,
    });

    const observeLastElement = () => {
      if (lastElementRef.current) {
        observer.observe(lastElementRef.current);
      }
    };

    observeLastElement(); // Observe the new last element

    return () => {
      observer.disconnect();
    };
  }, [events, displayCount, lastElementRef.current]);

  const imagesAndVideos = useMemo(() => {
    if (displayAs === 'feed') {
      return [];
    }
    return events
      .flatMap((event) => {
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
      })
      .slice(0, displayCount);
  }, [events, displayCount, displayAs]) as ImageOrVideo[];

  const renderFilterOptions = () => {
    return (
      <div className="flex mb-4 gap-2 mx-2 md:mx-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.name}
            className={`btn btn-sm ${
              filterOption.name === opt.name ? 'btn-primary' : 'btn-neutral'
            }`}
            onClick={() => {
              setFilterOption(opt);
              setDisplayCount(PAGE_SIZE);
            }}
          >
            {opt.name}
          </button>
        ))}
      </div>
    );
  };

  const renderDisplayAsSelector = () => {
    if (showDisplayAs === false) return null;
    return (
      <div className="flex mb-px">
        <button
          className={`rounded-sm flex justify-center flex-1 p-3 ${
            displayAs === 'feed' ? 'bg-neutral-800' : 'hover:bg-neutral-900'
          }`}
          onClick={() => {
            setDisplayCount(PAGE_SIZE);
            setDisplayAs('feed');
          }}
        >
          <Bars3Icon width={24} height={24} />
        </button>
        <button
          className={`rounded-sm flex justify-center flex-1 p-3 ${
            displayAs === 'grid' ? 'bg-neutral-800' : 'hover:bg-neutral-900'
          }`}
          onClick={() => {
            setDisplayCount(PAGE_SIZE);
            setDisplayAs('grid');
          }}
        >
          <Squares2X2Icon width={24} height={24} />
        </button>
      </div>
    );
  };

  const renderGrid = () => {
    return (
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
    );
  };

  return (
    <>
      <Show when={filterOptions.length > 1}>{renderFilterOptions()}</Show>
      {renderDisplayAsSelector()}
      <ImageModal
        setModalImageIndex={setModalImageIndex}
        modalItemIndex={modalItemIndex}
        imagesAndVideos={imagesAndVideos}
      />
      <Show when={isEmpty}>
        <div>{emptyMessage || 'No Posts'}</div>
      </Show>
      <div ref={lastElementRef}>
        {displayAs === 'grid'
          ? renderGrid()
          : events.slice(0, displayCount).map((event, index, self) => {
              const isLastElement = index === self.length - 1;
              return (
                <div key={`feed${event.id}${index}`} ref={isLastElement ? lastElementRef : null}>
                  <EventComponent id={event.id} {...filterOption.eventProps} />
                </div>
              );
            })}
      </div>
    </>
  );
};

export default memo(Feed);
