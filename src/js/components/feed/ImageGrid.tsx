import { useCallback, useEffect, useState } from 'react';

import Image from '@/components/embed/Image';
import Video from '@/components/embed/Video';
import ImageGridItem from '@/components/feed/ImageGridItem';
import ImageModal from '@/components/feed/ImageModal';
import { ImageOrVideo } from '@/components/feed/types';
import InfiniteScroll from '@/components/helpers/InfiniteScroll.tsx';
import Events from '@/nostr/Events';
import { getEventReplyingTo } from '@/nostr/utils.ts';

interface ImageGridProps {
  events: any[];
  loadMore: () => void;
}

function extractMediaFromEvent(event: any): ImageOrVideo[] {
  const imageMatches = (event.content.match(Image.regex) || []).map((url: string) => ({
    type: 'image',
    url,
    eventId: event.id,
  }));
  const videoMatches = (event.content.match(Video.regex) || []).map((url: string) => ({
    type: 'video',
    url,
    eventId: event.id,
  }));
  return [...imageMatches, ...videoMatches];
}

const ImageGrid = ({ events, loadMore }: ImageGridProps) => {
  const [mediaItems, setMediaItems] = useState<ImageOrVideo[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const updateMediaItems = useCallback(() => {
    const newMediaItems = events.flatMap((event) => {
      if (event.kind === 7) {
        const taggedEventId = getEventReplyingTo(event);
        if (taggedEventId) {
          const taggedEvent = Events.db.get(taggedEventId);
          return taggedEvent ? extractMediaFromEvent(taggedEvent) : [];
        }
        return [];
      } else {
        return extractMediaFromEvent(event);
      }
    });
    setMediaItems(newMediaItems);
  }, [events]);

  useEffect(() => {
    updateMediaItems();
  }, [events, updateMediaItems]);

  return (
    <div className="grid grid-cols-3 gap-px">
      <ImageModal
        setActiveItemIndex={setActiveItemIndex}
        activeItemIndex={activeItemIndex}
        mediaItems={mediaItems}
      />
      <InfiniteScroll loadMore={loadMore}>
        {mediaItems.map((item, index) => (
          <ImageGridItem
            key={`grid-${item.url}`}
            item={item}
            index={index}
            setActiveItemIndex={setActiveItemIndex}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default ImageGrid;
