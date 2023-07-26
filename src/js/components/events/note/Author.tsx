import { useMemo } from 'react';

import Helpers from '../../../Helpers';
import Key from '../../../nostr/Key';
import Show from '../../helpers/Show';
import Name from '../../user/Name';
import EventDropdown from '../EventDropdown';

import Avatar from './Avatar';
import ReplyingToUsers from './ReplyingToUsers';

const Author = ({ event, fullWidth, isQuote, standalone, setTranslatedText, isQuoting }) => {
  const { time, dateStr, timeStr } = useMemo(() => {
    const t = new Date(event.created_at * 1000);
    const dStr = t.toLocaleString(window.navigator.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const tStr = t.toLocaleTimeString(window.navigator.language, {
      timeStyle: 'short',
    });

    return { time: t, dateStr: dStr, timeStr: tStr };
  }, [event.created_at]);

  return (
    <div className="flex items-center gap-2 justify-between">
      <Show when={fullWidth}>
        <Avatar event={event} isQuote={isQuote} standalone={standalone} />
      </Show>
      <div className="flex flex-col">
        <div>
          <a href={`/${Key.toNostrBech32Address(event.pubkey, 'npub')}`} className="font-bold">
            <Name pub={event.pubkey} />
          </a>
          <small>
            {'· '}
            <a
              href={`/${Key.toNostrBech32Address(event.id, 'note')}`}
              className="tooltip text-neutral-500"
              data-tip={`${dateStr} ${timeStr}`}
            >
              {time && Helpers.getRelativeTimeText(time)}
            </a>
          </small>
        </div>

        <ReplyingToUsers event={event} isQuoting={isQuoting} />
      </div>
      <Show when={!isQuote}>
        <div className="flex-1 flex items-center justify-end">
          <EventDropdown id={event.id} event={event} onTranslate={setTranslatedText} />
        </div>
      </Show>
    </div>
  );
};

export default Author;
