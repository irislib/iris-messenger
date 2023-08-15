import { route } from 'preact-router';

import { ImageOrVideo } from '@/components/feed/types';
import SafeImg from '@/components/SafeImg';
import Key from '@/nostr/Key.ts';
import Icons from '@/utils/Icons.tsx';

type ImageGridItemProps = {
  item: ImageOrVideo;
  index: number;
  setActiveItemIndex: (index: number) => void;
  lastElementRef?: React.MutableRefObject<HTMLDivElement>;
};

export const ImageGridItem = ({
  item,
  index,
  setActiveItemIndex,
  lastElementRef,
}: ImageGridItemProps) => {
  const url =
    item.type === 'video' ? `https://imgproxy.iris.to/thumbnail/638/${item.url}` : item.url;

  return (
    <div
      key={`feed${url}${index}`}
      className="aspect-square cursor-pointer relative bg-neutral-300 hover:opacity-80"
      onClick={() => {
        if (window.innerWidth > 640) {
          setActiveItemIndex(index);
        } else {
          route(`/${Key.toNostrBech32Address(item.eventId, 'note')}`);
        }
      }}
      ref={lastElementRef}
    >
      <SafeImg square={true} width={319} src={url} alt="" className="w-full h-full object-cover" />
      {item.type === 'video' && (
        <div className="absolute top-0 right-0 m-2 shadow-md shadow-gray-500 ">{Icons.video}</div>
      )}
    </div>
  );
};

export default ImageGridItem;
