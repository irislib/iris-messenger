import { useMemo } from 'react';
import { Link } from 'preact-router';

import Key from '../../../nostr/Key';
import Show from '../../helpers/Show';
import RelativeTime from '../../RelativeTime';
import Name from '../../user/Name';
import EventDropdown from '../EventDropdown';

import Avatar from './Avatar';

const Author = ({ event, fullWidth, isQuote, standalone, setTranslatedText }) => {
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
        <Avatar event={event} isQuote={isQuote} standalone={standalone} fullWidth={fullWidth} />
      </Show>
      <div className="flex flex-col">
        <div>
          <Link href={`/${Key.toNostrBech32Address(event.pubkey, 'npub')}`} className="font-bold">
            <Name pub={event.pubkey} />
          </Link>
          <small className="text-neutral-500">
            <span className="mx-2">·</span>
            <Link
              href={`/${Key.toNostrBech32Address(event.id, 'note')}`}
              className="tooltip"
              data-tip={`${dateStr} ${timeStr}`}
            >
              <RelativeTime date={time} />
            </Link>
          </small>
        </div>
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
