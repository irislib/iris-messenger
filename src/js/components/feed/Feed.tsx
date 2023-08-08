import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { Bars3Icon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { Filter } from 'nostr-tools';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import EventComponent from '@/components/events/EventComponent';
import Modal from '@/components/modal/Modal';
import ProxyImg from '@/components/SafeImg';
import useSubscribe from '@/hooks/useSubscribe';
import { useLocalState } from '@/LocalState';

const PAGE_SIZE = 6;
const LOAD_MORE_MARGIN = '0px 0px 2000px 0px';

const VideoIcon = (
  <svg width="18" viewBox="0 0 122.88 111.34" fill="currentColor">
    <path d="M23.59,0h75.7a23.68,23.68,0,0,1,23.59,23.59V87.75A23.56,23.56,0,0,1,116,104.41l-.22.2a23.53,23.53,0,0,1-16.44,6.73H23.59a23.53,23.53,0,0,1-16.66-6.93l-.2-.22A23.46,23.46,0,0,1,0,87.75V23.59A23.66,23.66,0,0,1,23.59,0ZM54,47.73,79.25,65.36a3.79,3.79,0,0,1,.14,6.3L54.22,89.05a3.75,3.75,0,0,1-2.4.87A3.79,3.79,0,0,1,48,86.13V50.82h0A3.77,3.77,0,0,1,54,47.73ZM7.35,26.47h14L30.41,7.35H23.59A16.29,16.29,0,0,0,7.35,23.59v2.88ZM37.05,7.35,28,26.47H53.36L62.43,7.38v0Zm32,0L59.92,26.47h24.7L93.7,7.35Zm31.32,0L91.26,26.47h24.27V23.59a16.32,16.32,0,0,0-15.2-16.21Zm15.2,26.68H7.35V87.75A16.21,16.21,0,0,0,12,99.05l.17.16A16.19,16.19,0,0,0,23.59,104h75.7a16.21,16.21,0,0,0,11.3-4.6l.16-.18a16.17,16.17,0,0,0,4.78-11.46V34.06Z" />
  </svg>
);

type Props = {
  filterOptions: FilterOption[];
  showDisplayAs?: boolean;
  filterFn?: (event: any) => boolean;
  emptyMessage?: string;
};

type DisplayAs = 'feed' | 'grid';

type ImageOrVideo = {
  type: 'image' | 'video';
  url: string;
};

export type FilterOption = {
  name: string;
  filter: Filter;
  filterFn?: (event: any) => boolean;
};

const Feed = ({ showDisplayAs, filterOptions, emptyMessage }: Props) => {
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
    // in keyword search, relays should be queried for all events, not just sinceLastOpened
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    sinceLastOpened: false,
  });

  // deduplicate
  const events = useMemo(() => {
    const filtered = allEvents
      .filter((event) => {
        if (mutedUsers[event.pubkey]) {
          return false;
        }
        if (filterOption.filterFn) {
          return filterOption.filterFn(event);
        }
        return true;
      })
      .sort((a, b) => b.created_at - a.created_at);
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

  const goToPrevImage = () => {
    if (modalItemIndex === null) return;
    const prevImageIndex = (modalItemIndex - 1 + imagesAndVideos.length) % imagesAndVideos.length;
    setModalImageIndex(prevImageIndex);
  };

  const goToNextImage = () => {
    if (modalItemIndex === null) return;
    const nextImageIndex = (modalItemIndex + 1) % imagesAndVideos.length;
    setModalImageIndex(nextImageIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalItemIndex]);

  const renderFilterOptions = () => {
    return (
      <div className="flex mb-4 gap-2 mx-2 md:mx-0">
        {filterOptions.map((filterOption) => (
          <button
            key={filterOption.name}
            className={`btn btn-sm ${
              filterOption.name === filterOption.name ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={() => {
              setFilterOption(filterOption);
              setDisplayCount(PAGE_SIZE);
            }}
          >
            {filterOption.name}
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
        {imagesAndVideos.map((item, index) => renderGridItem(item, index))}
      </div>
    );
  };

  const renderGridItem = (item: { url: string; type: 'image' | 'video' }, index: number) => {
    const url =
      item.type === 'video' ? `https://imgproxy.iris.to/thumbnail/638/${item.url}` : item.url;
    return (
      <div
        key={`feed${url}${index}`}
        className="aspect-square cursor-pointer relative bg-neutral-300 hover:opacity-80"
        ref={index === imagesAndVideos.length - 1 ? lastElementRef : null}
        onClick={() => {
          setModalImageIndex(index);
        }}
      >
        <ProxyImg
          square={true}
          width={319}
          src={url}
          alt=""
          className="w-full h-full object-cover"
        />
        {item.type === 'video' && (
          <div className="absolute top-0 right-0 m-2 shadow-md shadow-gray-500 ">{VideoIcon}</div>
        )}
      </div>
    );
  };

  const renderImageModal = () => {
    return modalItemIndex !== null ? (
      <Modal onClose={() => setModalImageIndex(null)}>
        <div className="relative w-full h-full flex justify-center">
          {imagesAndVideos[modalItemIndex].type === 'video' ? (
            <video
              className="rounded max-h-[90vh] max-w-[90vw] object-contain"
              src={imagesAndVideos[modalItemIndex].url}
              controls
              muted
              autoPlay
              loop
              poster={`https://imgproxy.iris.to/thumbnail/638/${imagesAndVideos[modalItemIndex].url}`}
            />
          ) : (
            <img
              className="rounded max-h-[90vh] max-w-[90vw] object-contain"
              src={imagesAndVideos[modalItemIndex].url}
            />
          )}
          <div className="flex items-center justify-between w-full h-full absolute bottom-0 left-0 right-0">
            <div
              className="p-4"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevImage();
              }}
            >
              <button className="btn btn-circle btn-sm opacity-25 mr-2 flex-shrink-0">
                <ChevronLeftIcon width={20} />
              </button>
            </div>
            <div
              className="p-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
            >
              <button className="btn btn-circle btn-sm opacity-25 ml-2 flex-shrink-0">
                <ChevronRightIcon width={20} />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    ) : (
      ''
    );
  };

  return (
    <>
      {filterOptions.length > 1 && renderFilterOptions()}
      {renderDisplayAsSelector()}
      {renderImageModal()}
      {isEmpty && <p>{emptyMessage || 'No Posts'}</p>}
      <div ref={lastElementRef}>
        {displayAs === 'grid'
          ? renderGrid()
          : events.slice(0, displayCount).map((event, index, self) => {
              const isLastElement = index === self.length - 1;
              return (
                <div key={`feed${event.id}${index}`} ref={isLastElement ? lastElementRef : null}>
                  <EventComponent id={event.id} />
                </div>
              );
            })}
      </div>
    </>
  );
};

export default memo(Feed);
