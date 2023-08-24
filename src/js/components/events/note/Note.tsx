import { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { Filter } from 'nostr-tools';
import { Link, route } from 'preact-router';

import InfiniteScroll from '@/components/helpers/InfiniteScroll';
import useSubscribe from '@/nostr/hooks/useSubscribe.ts';
import { getEventReplyingTo, getEventRoot } from '@/nostr/utils';

import Key from '../../../nostr/Key';
import { translate as t } from '../../../translations/Translation.mjs';
import Show from '../../helpers/Show';
import EventComponent from '../EventComponent';

import Avatar from './Avatar';
import Content from './Content';

interface NoteProps {
  event: any; // Define the proper type
  asInlineQuote?: boolean;
  isReply?: boolean;
  isQuote?: boolean;
  isQuoting?: boolean;
  showReplies?: number;
  showRepliedMsg?: boolean;
  standalone?: boolean;
  fullWidth?: boolean;
}

const Note: React.FC<NoteProps> = ({
  event,
  asInlineQuote = false,
  isReply = false,
  showReplies = 0,
  showRepliedMsg,
  standalone = false,
  fullWidth,
  isQuote = false,
  isQuoting = false,
}) => {
  const replyingTo = useMemo(() => getEventReplyingTo(event), [event.id]);

  const repliesFilter = useMemo(() => {
    const filter: Filter = { '#e': [event.id], kinds: [1] };
    if (showReplies !== Infinity) {
      filter.limit = showReplies;
    }
    return filter;
  }, [event.id, showReplies]);
  const repliesFilterFn = useCallback((e) => getEventReplyingTo(e) === event.id, [event.id]);

  const { events: replies } = useSubscribe({
    filter: repliesFilter,
    filterFn: repliesFilterFn,
    enabled: !!showReplies,
  });

  if (showRepliedMsg === undefined) {
    showRepliedMsg = standalone;
  }

  if (fullWidth === undefined) {
    fullWidth = !isReply && !isQuoting && !isQuote && !asInlineQuote;
  }

  const computedIsQuote = useMemo(
    () => isQuote || (!standalone && showReplies && replies.length),
    [isQuote, standalone, showReplies, replies.length],
  );
  const computedIsQuoting = useMemo(
    () => isQuoting || (replyingTo && showRepliedMsg),
    [isQuoting, replyingTo, showRepliedMsg],
  );

  const className = useMemo(() => {
    return classNames({
      'cursor-pointer transition-all ease-in-out duration-200 hover:bg-neutral-999': !standalone,
      'quote pb-2': computedIsQuote,
      'quoting pt-0': computedIsQuoting,
      'pt-4': !computedIsQuoting,
      'inline-quote border-2 border-neutral-900 rounded-lg my-2': asInlineQuote,
      'full-width':
        fullWidth || (!isReply && !computedIsQuoting && !computedIsQuote && !asInlineQuote),
    });
  }, [standalone, computedIsQuote, computedIsQuoting, asInlineQuote, fullWidth]);

  let threadRootId = getEventRoot(event);
  if (!threadRootId) {
    threadRootId = replyingTo;
  }

  function messageClicked(clickEvent) {
    if (standalone) {
      return;
    }
    if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => clickEvent.target.closest(tag))) {
      return;
    }
    if (window.getSelection()?.toString()) {
      return;
    }
    clickEvent.stopPropagation();
    if (event.kind === 7) {
      const likedId = event.tags?.reverse().find((t) => t[0] === 'e')[1];
      return route(`/${likedId}`);
    }
    route(`/${Key.toNostrBech32Address(event.id, 'note')}`);
  }

  const repliedMsg =
    replyingTo && showRepliedMsg ? (
      <EventComponent key={event.id + replyingTo} id={replyingTo} isQuote={true} showReplies={0} />
    ) : null;

  const showThreadBtn = (
    <Show when={!standalone && !showRepliedMsg && !isReply && !isQuoting && threadRootId}>
      <Link
        className="text-iris-blue text-sm block mb-2"
        href={`/${Key.toNostrBech32Address(threadRootId || '', 'note')}`}
      >
        {t('show_thread')}
      </Link>
    </Show>
  );

  return (
    <>
      {repliedMsg}
      <div
        key={event.id + 'note'}
        className={`px-2 md:px-4 pb-2 ${className}`}
        onClick={(e) => messageClicked(e)}
      >
        {showThreadBtn}
        <div className="flex flex-row" onClick={(e) => messageClicked(e)}>
          <Show when={!fullWidth}>
            <Avatar event={event} isQuote={isQuote} standalone={standalone} fullWidth={fullWidth} />
          </Show>
          <Content
            event={event}
            standalone={standalone}
            isQuote={isQuote}
            asInlineQuote={asInlineQuote}
            fullWidth={fullWidth}
          />
        </div>
      </div>
      <Show when={!(isQuote || asInlineQuote)}>
        <hr className="opacity-10" />
      </Show>
      <InfiniteScroll>
        {replies.reverse().map((r) => (
          <EventComponent
            key={r.id}
            id={r.id}
            isReply={true}
            isQuoting={!standalone}
            showReplies={1}
          />
        ))}
      </InfiniteScroll>
    </>
  );
};

export default Note;
