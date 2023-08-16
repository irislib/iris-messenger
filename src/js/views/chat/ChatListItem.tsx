import { memo } from 'react';
import { route } from 'preact-router';

import Show from '../../components/helpers/Show';
import RelativeTime from '../../components/RelativeTime';
import Avatar from '../../components/user/Avatar';
import Name from '../../components/user/Name';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';

const ChatListItem = ({ chat, active = false, latestMsg = {} as any, name }) => {
  const onKeyUp = (e: KeyboardEvent) => {
    // if enter was pressed, click the element
    if (e.keyCode === 13) {
      (e.target as HTMLElement).click();
    }
  };

  const npub = Key.toNostrBech32Address(chat, 'npub');

  return (
    <div
      onKeyUp={onKeyUp}
      role="button"
      tabIndex={0}
      className={`p-2 ${active ? 'bg-neutral-800' : 'hover:bg-neutral-900'}`}
      onClick={() => route(`/chat/${npub || chat}`)}
    >
      <div className="flex gap-4 overflow-x-hidden">
        <Avatar str={npub || chat} width={49} />
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
              <Show when={latestMsg.created_at}>
                <small className="ml-2 latest-time text-neutral-500">
                  <RelativeTime date={new Date(latestMsg.created_at * 1000)} />
                </small>
              </Show>
            </Show>
          </span>
          <small className="text-neutral-500 truncate">{latestMsg.text}</small>
        </div>
      </div>
    </div>
  );
};

export default memo(ChatListItem);
