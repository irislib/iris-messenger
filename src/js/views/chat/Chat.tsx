import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'preact/hooks';

import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import View from '../View';

import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import Header from './Header';
import NewChat, { addChatWithInputKey } from './NewChat';

const Chat = ({ id }) => {
  useEffect(() => {
    const hashId = window.location.hash.substr(1);
    if (hashId && hashId.startsWith('nsec')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (!Key.getPubKey()) {
        Key.loginAsNewUser();
      }
      addChatWithInputKey(hashId);
    }
  }, []);

  const renderContent = (chatId) => {
    if (chatId === 'new') {
      return <NewChat />;
    } else if (chatId) {
      return <ChatMessages id={chatId} key={chatId} />;
    } else {
      return (
        <div className="hidden md:flex flex-col items-center justify-center flex-1">
          <div className="my-4">
            <PaperAirplaneIcon className="w-24 h-24 text-neutral-400" />
          </div>
          <div className="text-neutral-400">{t('dm_privacy_warning')}</div>
        </div>
      );
    }
  };

  return (
    <View>
      <div className="flex flex-col h-full max-h-screen">
        <Header key={id} activeChat={id} />
        <div className="flex flex-row flex-grow overflow-hidden">
          <div
            className={`flex-shrink-0 ${
              id ? 'hidden md:flex overflow-y-auto' : 'flex overflow-y-auto'
            }`}
          >
            <ChatList activeChat={id} className={id ? 'hidden md:flex' : 'flex'} />
          </div>
          <div
            key={`chat-content-${id}`}
            className={`flex-grow overflow-y-auto ${!id ? 'hidden md:flex' : 'flex'}`}
          >
            {renderContent(id)}
          </div>
        </div>
      </div>
    </View>
  );
};

export default Chat;
