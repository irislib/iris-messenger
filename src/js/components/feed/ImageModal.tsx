import { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

import EventComponent from '@/components/events/EventComponent.tsx';
import { ImageOrVideo } from '@/components/feed/types.ts';
import Modal from '@/components/modal/Modal';
import SafeImg from '@/components/SafeImg';

type ImageModalProps = {
  mediaItems: Array<ImageOrVideo>;
  activeItemIndex: number | null;
  setActiveItemIndex: (index: number | null) => void;
};

const ImageModal = ({ mediaItems, activeItemIndex, setActiveItemIndex }: ImageModalProps) => {
  const goToPrevImage = () => {
    if (activeItemIndex === null) return;
    const prevImageIndex = (activeItemIndex - 1 + mediaItems.length) % mediaItems.length;
    setActiveItemIndex(prevImageIndex);
  };

  const goToNextImage = () => {
    if (activeItemIndex === null) return;
    const nextImageIndex = (activeItemIndex + 1) % mediaItems.length;
    setActiveItemIndex(nextImageIndex);
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
  }, [activeItemIndex, mediaItems]);

  if (activeItemIndex === null) {
    return null;
  }

  const activeItem = mediaItems[activeItemIndex];

  return (
    <Modal width="100%" height="100%" onClose={() => setActiveItemIndex(null)}>
      <div className="relative w-full h-full flex">
        {/* Left side: Media content */}
        <div className="flex h-full justify-center items-center flex-1 relative">
          {activeItem.type === 'video' ? (
            <video
              className="rounded max-h-full max-w-full object-contain"
              src={activeItem.url}
              controls
              muted
              autoPlay
              loop
              poster={`https://imgproxy.iris.to/thumbnail/638/${activeItem.url}`}
            />
          ) : (
            <SafeImg
              key={activeItem.url}
              className="max-h-full max-w-full object-contain"
              src={activeItem.url}
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
              <button className="btn btn-circle btn-sm opacity-50 mr-2 flex-shrink-0">
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
              <button className="btn btn-circle btn-sm opacity-50 ml-2 flex-shrink-0">
                <ChevronRightIcon width={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: EventComponent */}
        <div className="w-96 p-4 border-l border-neutral-900 overflow-y-auto bg-black h-full">
          <EventComponent
            key={activeItem.eventId}
            id={activeItem.eventId}
            standalone={true}
            showReplies={Infinity}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ImageModal;
