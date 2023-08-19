import { useState } from 'react';

import Show from '../helpers/Show';
import Modal from '../modal/Modal';
import SafeImg from '../SafeImg';

import Embed from './index';

const Image: Embed = {
  regex: /(https?:\/\/\S+?\.(?:png|jpg|jpeg|gif|svg|webp)(?:\?\S*?)?)/gi,
  settingsKey: 'enableImages',
  component: ({ match, index }) => {
    const [showModal, setShowModal] = useState(false);
    const [hasError, setHasError] = useState(false);
    const onClick = (e) => {
      e.stopPropagation();
      setShowModal(true);
    };

    if (hasError) {
      return <div className="my-2 text-sm">{match}</div>;
    }

    return (
      <div
        key={match + index}
        className="flex justify-center items-center md:justify-start min-h-96 my-2"
      >
        <SafeImg
          onError={() => setHasError(true)}
          onClick={onClick}
          className="my-2 rounded md:max-h-96 max-w-full cursor-pointer"
          src={match}
        />
        <Show when={showModal}>
          <Modal centerVertically={true} onClose={() => setShowModal(false)}>
            <SafeImg className="rounded max-h-[90vh] max-w-[90vw]" src={match} />
          </Modal>
        </Show>
      </div>
    );
  },
};

export default Image;
