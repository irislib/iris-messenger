import { useState } from 'preact/hooks';

import Modal from './modal/Modal';
import SafeImg from './SafeImg';

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
    <>
      <SafeImg
        width={192}
        square={true}
        className="rounded-full w-48"
        src={picture}
        onError={onError}
        onClick={handleClick}
      />
      {showModal && (
        <Modal centerVertically={true} onClose={handleClose}>
          <SafeImg width={192} square={true} src={picture} onError={onError} />
        </Modal>
      )}
    </>
  );
};

export default ProfilePicture;
