import { useCallback, useEffect, useState } from 'react';
import $ from 'jquery';
import { throttle } from 'lodash';

import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation.mjs';

import ChatListItem from './ChatListItem';
import NewChatButton from './NewChatButton';

const ChatList = ({ activeChat, className }) => {
  const [directMessages, setDirectMessages] = useState(new Map());
  const [groups, setGroups] = useState(new Map());
  const [sortedChats, setSortedChats] = useState([] as string[]);

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
    unsubs.push(
      Events.getDirectMessages(async (incomingChats) => {
        let keys = Array.from(incomingChats.keys());
        const maxFollowDistance = await localState
          .get('globalFilter')
          .get('maxFollowDistance')
          .once();
        const blockedUsers = Object.keys((await localState.get('blockedUsers').once()) || {});
        keys = keys.filter(
          (key) =>
            !blockedUsers.includes(key) &&
            SocialNetwork.getFollowDistance(key) <= maxFollowDistance,
        );

        const filteredChats = new Map(keys.map((k) => [k, incomingChats.get(k)]));
        setDirectMessages(filteredChats);
      }),
    );

    unsubs.push(localState.get('scrollUp').on(() => window.scrollTo(0, 0)));

    unsubs.push(
      localState.get('groups').map((group, localKey) => {
        if (!(group && localKey)) return;
        group.eventIds = new Map();
        setGroups((prevGroups) => new Map(prevGroups.set(localKey, group)));
      }),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const throttledSortChats = useCallback(
    // TODO use SortedMap instead
    throttle(
      (directMessages, groups) => {
        const chats: Map<string, any> = new Map(directMessages);
        groups.forEach((value, key) => {
          chats.set(key, value);
        });
        const sorted = Array.from(chats.keys()).sort((a, b) => {
          if (a.length < b.length) return -1; // show groups first until their last msg is implemented
          const aEventIds = chats.get(a).eventIds;
          const bEventIds = chats.get(b).eventIds;
          const aLatestEvent = aEventIds.length ? Events.db.by('id', aEventIds[0]) : null;
          const bLatestEvent = bEventIds.length ? Events.db.by('id', bEventIds[0]) : null;

          return bLatestEvent?.created_at - aLatestEvent?.created_at;
        }) as string[];
        setSortedChats(sorted);
      },
      1000,
      { leading: true },
    ),
    [],
  );

  useEffect(() => {
    throttledSortChats(directMessages, groups);
  }, [directMessages, groups]);

  const activeChatHex = (activeChat && Key.toNostrHexAddress(activeChat)) || activeChat;

  return (
    <section
      className={`border-r border-neutral-800 overflow-x-hidden overflow-y-auto h-full md:px-0 w-full md:w-64 ${className}`}
    >
      <div id="enable-notifications-prompt" className="hidden" onClick={enableDesktopNotifications}>
        <div className="title">{t('get_notified_new_messages')}</div>
        <div>
          <a>{t('turn_on_desktop_notifications')}</a>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <NewChatButton active={activeChatHex === 'new'} />
        {sortedChats.map((pubkey) => (
          <ChatListItem
            active={pubkey === activeChatHex}
            key={pubkey}
            chat={pubkey}
            latestMsgId={directMessages.get(pubkey)?.eventIds[0]}
          />
        ))}
      </div>
    </section>
  );
};

export default ChatList;
