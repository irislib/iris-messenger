import { useState } from 'preact/hooks';

import Modal from '../modal/Modal';
import SafeImg from '../SafeImg';

type Props = { picture?: string; onError?: () => void };

const ProfilePicture = ({ picture, onError }: Props) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!picture) {
    return null;
  }

  return (
    <div className="rounded-full border-4 border-black bg-black">
      <SafeImg
        width={128}
        square={true}
        className="rounded-full cursor-pointer"
        src={picture}
        onError={onError}
        onClick={handleClick}
      />
      {showModal && (
        <Modal centerVertically={true} onClose={handleClose}>
          <SafeImg
            className="max-w-full max-h-[90vh]"
            square={true}
            src={picture}
            onError={onError}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProfilePicture;
