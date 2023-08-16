import Modal from '@/components/modal/Modal';
import SafeImg from '@/components/SafeImg';

type SimpleImageModalProps = {
  imageUrl: string;
  onClose: () => void;
};

const SimpleImageModal = ({ imageUrl, onClose }: SimpleImageModalProps) => {
  return (
    <Modal width="100%" height="100%" onClose={onClose}>
      <div className="flex h-full justify-center items-center">
        <SafeImg className="max-h-full max-w-full object-contain" src={imageUrl} />
      </div>
    </Modal>
  );
};

export default SimpleImageModal;
