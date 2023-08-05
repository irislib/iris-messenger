import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';

import localState from '../../LocalState';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import SortedMap from '../../utils/SortedMap';

import ChatListItem from './ChatListItem';
import NewChatButton from './NewChatButton';

const sortChats = (a: { key: string; value: any }, b: { key: string; value: any }) => {
  const aLatest = a.value.latest;
  const bLatest = b.value.latest;
  if (!aLatest) return 1;
  if (!bLatest) return -1;
  return bLatest.created_at - aLatest.created_at;
};

const ChatList = ({ activeChat, className }) => {
  const [chats, setChats] = useState(new SortedMap<string, any>(sortChats) as any);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_renderCount, setRenderCount] = useState(0); // new state variable
  const chatListRef = useRef(null as any);

  const enableDesktopNotifications = () => {
    if (Notification) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted' || permission === 'denied') {
          $('#enable-notifications-prompt').slideUp();
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

    /*
    unsubs.push(
      localState.get('groups').map((group, localKey) => {
        if (!(group && localKey)) return;
        group.eventIds = new Map();
        setGroups((prevGroups) => new Map(prevGroups.set(localKey, group)));
      }),
    );
     */

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const activeChatHex = (activeChat && Key.toNostrHexAddress(activeChat)) || activeChat;

  return (
    <section
      className={`md:border-r flex flex-shrink-0 border-neutral-800 overflow-x-hidden overflow-y-auto md:px-0 w-full md:w-64 ${className}`}
      ref={chatListRef}
    >
      <div id="enable-notifications-prompt" className="hidden" onClick={enableDesktopNotifications}>
        <div className="title">{t('get_notified_new_messages')}</div>
        <div>
          <a>{t('turn_on_desktop_notifications')}</a>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <NewChatButton active={activeChatHex === 'new'} />
        {Array.from<[string, any]>(chats.entries() as any).map(([pubkey, data]) => (
          <ChatListItem
            active={pubkey === activeChatHex}
            key={pubkey}
            chat={pubkey}
            latestMsg={data?.latest}
            name={data?.name}
          />
        ))}
      </div>
    </section>
  );
};

export default ChatList;
