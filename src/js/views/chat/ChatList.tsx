import { useEffect, useRef, useState } from 'react';

import InfiniteScroll from '@/components/helpers/InfiniteScroll';

import Key from '../../nostr/Key';
import localState from '../../state/LocalState.ts';
import { translate as t } from '../../translations/Translation.mjs';
import SortedMap from '../../utils/SortedMap';

import ChatListItem from './ChatListItem';
import NewChatButton from './NewChatButton';

const sortChats = (a: [string, any], b: [string, any]) => {
  const aLatest = a[1].latest;
  const bLatest = b[1].latest;

  if (!aLatest) return 1;
  if (!bLatest) return -1;

  return bLatest.created_at - aLatest.created_at;
};

const ChatList = ({ activeChat, className }) => {
  const [chats, setChats] = useState(new SortedMap<string, any>([], sortChats) as any);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_renderCount, setRenderCount] = useState(0); // new state variable
  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const chatListRef = useRef(null as any);

  const enableDesktopNotifications = () => {
    if (Notification) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted' || permission === 'denied') {
          setShowNotificationsPrompt(false);
        }
        // TODO: subscribe to web push if permission is granted.
      });
    }
  };

  useEffect(() => {
    const unsubs = [] as any[];

    const addToChats = (value, key) => {
      setChats((prevChats) => {
        prevChats.set(key, { ...value });
        return prevChats;
      });
      setRenderCount((prevCount) => prevCount + 1);
    };

    const myPub = Key.getPubKey();
    localState.get('chats').get(myPub).put({ id: myPub });
    unsubs.push(localState.get('chats').map(addToChats));
    unsubs.push(localState.get('groups').map(addToChats));

    unsubs.push(
      localState.get('scrollUp').on(() => {
        window.scrollTo(0, 0);
        if (chatListRef.current) {
          chatListRef.current.scrollTop = 0;
        }
      }),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const activeChatHex = (activeChat && Key.toNostrHexAddress(activeChat)) || activeChat;

  return (
    <section
      className={`md:border-r flex flex-shrink-0 border-neutral-800 overflow-x-hidden overflow-y-auto md:px-0 w-full md:w-64 ${className}`}
      ref={chatListRef}
    >
      <div className={showNotificationsPrompt ? '' : 'hidden'} onClick={enableDesktopNotifications}>
        <div className="title">{t('get_notified_new_messages')}</div>
        <div>
          <a>{t('turn_on_desktop_notifications')}</a>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <NewChatButton active={activeChatHex === 'new'} />
        <InfiniteScroll>
          {Array.from<[string, any]>(chats.entries() as any).map(([pubkey, data]) => (
            <ChatListItem
              active={pubkey === activeChatHex}
              key={pubkey}
              chat={pubkey}
              latestMsg={data?.latest}
              name={data?.name}
            />
          ))}
        </InfiniteScroll>
      </div>
    </section>
  );
};

export default ChatList;
