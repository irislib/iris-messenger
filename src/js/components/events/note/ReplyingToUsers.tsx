import { memo } from 'react';

import Key from '../../../nostr/Key';
import { translate as t } from '../../../translations/Translation.mjs';
import For from '../../helpers/For';
import Show from '../../helpers/Show';
import Name from '../../Name';

const ReplyingToUsers = ({ event, isQuoting }) => {
  let replyingToUsers = [];
  const hasETags = event.tags?.some((t) => t[0] === 'e');
  if (hasETags) {
    replyingToUsers = event?.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
  }
  // remove duplicates
  replyingToUsers = [...new Set(replyingToUsers)];

  return (
    <Show when={replyingToUsers?.length && !isQuoting}>
      <small className="text-neutral-500">
        {t('replying_to') + ' '}
        <For each={replyingToUsers.slice(3)}>
          {(u) => (
            <a href={`/${Key.toNostrBech32Address(u, 'npub')}`}>
              @<Name pub={u} hideBadge={true} />{' '}
            </a>
          )}
        </For>
        {replyingToUsers?.length > 3 ? '...' : ''}
      </small>
    </Show>
  );
};

export default memo(ReplyingToUsers);
