import { ImageOrVideo } from '@/components/feed/types';
import SafeImg from '@/components/SafeImg';
import Icons from '@/Icons';

type ImageGridItemProps = {
  item: ImageOrVideo;
  index: number;
  setModalImageIndex: (index: number) => void;
  imagesAndVideosLength: number;
  lastElementRef?: React.MutableRefObject<HTMLDivElement | null>;
};

export const ImageGridItem = ({
  item,
  index,
  setModalImageIndex,
  imagesAndVideosLength,
  lastElementRef,
}: ImageGridItemProps) => {
  const url =
    item.type === 'video' ? `https://imgproxy.iris.to/thumbnail/638/${item.url}` : item.url;
  const isLast = index === imagesAndVideosLength - 1;

  return (
    <div
      key={`feed${url}${index}`}
      className="aspect-square cursor-pointer relative bg-neutral-300 hover:opacity-80"
      ref={isLast ? lastElementRef : null}
      onClick={() => {
        setModalImageIndex(index);
      }}
    >
      <SafeImg square={true} width={319} src={url} alt="" className="w-full h-full object-cover" />
      {item.type === 'video' && (
        <div className="absolute top-0 right-0 m-2 shadow-md shadow-gray-500 ">{Icons.video}</div>
      )}
    </div>
  );
};

export default ImageGridItem;
