import { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

import Modal from '@/components/modal/Modal';
import SafeImg from '@/components/SafeImg';

type ImageModalProps = {
  imagesAndVideos: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  modalItemIndex: number | null;
  setModalItemIndex: (index: number | null) => void;
};

const ImageModal = ({ imagesAndVideos, modalItemIndex, setModalItemIndex }: ImageModalProps) => {
  const goToPrevImage = () => {
    if (modalItemIndex === null) return;
    const prevImageIndex = (modalItemIndex - 1 + imagesAndVideos.length) % imagesAndVideos.length;
    setModalItemIndex(prevImageIndex);
  };

  const goToNextImage = () => {
    if (modalItemIndex === null) return;
    const nextImageIndex = (modalItemIndex + 1) % imagesAndVideos.length;
    setModalItemIndex(nextImageIndex);
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
  }, [modalItemIndex, imagesAndVideos]);

  return modalItemIndex !== null ? (
    <Modal onClose={() => setModalItemIndex(null)}>
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
          <SafeImg
            key={imagesAndVideos[modalItemIndex].url}
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
  ) : null;
};

export default ImageModal;
