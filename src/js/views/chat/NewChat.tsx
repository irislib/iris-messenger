import { generatePrivateKey } from 'nostr-tools';
import { route } from 'preact-router';

import localState from '../../LocalState';
import { translate as t } from '../../translations/Translation.mjs';

export default function NewChat() {
  const startNewGroup = () => {
    const randomChatID = Math.floor(Math.random() * 1000000000);
    const newNostrKey = generatePrivateKey();
    localState.get(`groups/${randomChatID}/key`).put(newNostrKey);
    route(`/chat/${randomChatID}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full">
      <button className="btn btn-primary" onClick={startNewGroup}>
        {t('start_new_group')}
      </button>
      <div className="my-4">{t('or')}</div>
      <div className="my-4 flex gap-2 justify-center items-center">
        <input
          placeholder="Paste a chat link"
          type="text"
          id="pasteLink"
          className="text-center input border border-gray-400 rounded p-2"
        />
        <button id="scanQR" className="btn btn-neutral">
          {t('Scan QR Code')}
        </button>
      </div>
    </div>
  );
}
