import { PlusIcon } from '@heroicons/react/24/solid';
import { route } from 'preact-router';

import { translate as t } from '../../translations/Translation.mjs';

const NewChatButton = ({ active }) => (
  <div
    role="button"
    tabIndex={0}
    className={`flex p-2 flex-row gap-4 h-16 items-center cursor-pointer hover:bg-neutral-900 ${
      active ? 'bg-neutral-700' : ''
    }`}
    onClick={() => route(`/chat/new`)}
  >
    <div className="flex justify-center items-center w-12 h-12 rounded-full">
      <PlusIcon className="w-6 h-6" />
    </div>
    <div className="flex flex-row">
      <div className="flex flex-col">
        <span className="name">{t('new_chat')}</span>
      </div>
    </div>
  </div>
);

export default NewChatButton;
