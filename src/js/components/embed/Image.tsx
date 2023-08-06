import { useState } from 'react';

import Show from '../helpers/Show';
import Modal from '../modal/Modal';
import SafeImg from '../SafeImg';

import Embed from './index';

const Image: Embed = {
  regex: /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp)(?:\?\S*)?)/gi,
  settingsKey: 'enableImages',
  component: ({ match }) => {
    const [showModal, setShowModal] = useState(false);
    const onClick = (e) => {
      e.stopPropagation();
      setShowModal(true);
    };
    return (
      <div>
        <div className="relative w-full overflow-hidden object-contain my-2">
          <SafeImg
            onClick={onClick}
            className="rounded max-h-[70vh] md:max-h-96 max-w-full cursor-pointer"
            src={match}
          />
        </div>
        <Show when={showModal}>
          <Modal onClose={() => setShowModal(false)}>
            <SafeImg className="rounded max-h-[90vh] max-w-[90vw]" src={match} />
          </Modal>
        </Show>
      </div>
    );
  },
};

export default Image;
