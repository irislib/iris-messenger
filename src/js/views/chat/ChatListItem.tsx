import { memo } from 'react';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Show from '../../components/helpers/Show';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

const ChatListItem = ({ chat, active = false, latestMsgId = null }) => {
  const [name, setName] = useState(null);
  const [latest, setLatest] = useState({} as any);
  const [latestText, setLatestText] = useState('');

  useEffect(() => {
    const isGroup = chat.length < 20;
    if (isGroup) {
      localState
        .get('groups')
        .get(chat)
        .on((group) => {
          if (group.name) {
            setName(group.name);
          }
        });
    }
    getLatestMsg();
  }, [chat]);

  useEffect(() => {
    getLatestMsg();
  }, [latestMsgId]);

  const onKeyUp = (e: KeyboardEvent) => {
    // if enter was pressed, click the element
    if (e.keyCode === 13) {
      (e.target as HTMLElement).click();
    }
  };

  const getLatestMsg = () => {
    if (!latestMsgId) {
      return;
    }
    const event = Events.db.by('id', latestMsgId);
    if (event) {
      setLatest(event);
      Key.decryptMessage(latestMsgId, (text: string) => {
        setLatestText(text);
      });
    }
  };

  const activeClass = active ? 'bg-neutral-800' : 'hover:bg-neutral-900';
  const time =
    (latest.created_at && Helpers.getRelativeTimeText(new Date(latest.created_at * 1000))) || '';

  const npub = Key.toNostrBech32Address(chat, 'npub');

  return (
    <div
      onKeyUp={onKeyUp}
      role="button"
      tabIndex={0}
      className={`flex p-2 flex-row gap-4 ${activeClass}`}
      onClick={() => route(`/chat/${npub || chat}`)}
    >
      <Avatar str={npub || chat} width={49} />
      <div className="flex flex-row">
        <div className="flex flex-col">
          <span className="name">
            <Show when={name}>{name}</Show>
            <Show when={!name}>
              <Show when={chat === Key.getPubKey()}>
                <span className="font-bold italic">📝 {t('note_to_self')}</span>
              </Show>
              <Show when={chat !== Key.getPubKey()}>
                <Name pub={chat} />
              </Show>
              <small className="ml-2 latest-time text-neutral-500">{time}</small>
            </Show>
          </span>
          <small className="text-neutral-500 truncate">{latestText}</small>
        </div>
      </div>
    </div>
  );
};

export default memo(ChatListItem);
