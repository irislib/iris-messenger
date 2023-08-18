import { useMemo } from 'react';
import { Event } from 'nostr-tools';
import { useEffect, useState } from 'preact/hooks';
import { Link, route } from 'preact-router';

import InfiniteScroll from '@/components/helpers/InfiniteScroll.tsx';
import PubSub from '@/nostr/PubSub.ts';
import { getEventReplyingTo, getEventRoot } from '@/nostr/utils.ts';
import SortedMap from '@/utils/SortedMap.tsx';

import Key from '../../../nostr/Key';
import { translate as t } from '../../../translations/Translation.mjs';
import Show from '../../helpers/Show';
import EventComponent from '../EventComponent';

import Avatar from './Avatar';
import Content from './Content';

import useVerticeMonitor from '../../../dwotr/hooks/useVerticeMonitor';
import { ID } from '../../../nostr/UserIds';


const Note = ({
  event,
  meta = {} as any,
  asInlineQuote = false,
  isReply = false, // message that is rendered under a standalone message, separated by a small margin
  isQuote = false, // message that connects to the next message with a line
  isQuoting = false, // message that is under an isQuote message, no margin
  showReplies = 0,
  showRepliedMsg,
  standalone = false,
  fullWidth,
}) => {
  const [replies, setReplies] = useState([] as string[]);

  if (!standalone && showReplies && replies.length) {
    isQuote = true;
  }
  if (meta.replyingTo && showRepliedMsg) {
    isQuoting = true;
  }

  if (showRepliedMsg === undefined) {
    showRepliedMsg = standalone;
  }

  if (fullWidth === undefined) {
    fullWidth = !isReply && !isQuoting && !isQuote && !asInlineQuote;
  }

  const wot = useVerticeMonitor(ID(event.id), ["badMessage", "neutralMessage", "goodMessage"], "" ) as any;

  const className = useMemo(() => {
    const classNames = [] as string[];

    if (standalone) {
      classNames.push('');
    } else {
      classNames.push(
        'cursor-pointer transition-all ease-in-out duration-200 hover:bg-neutral-999',
      );
    }
    if (isQuote) classNames.push('quote pb-2');
    if (isQuoting) {
      classNames.push('quoting pt-0');
    } else {
      classNames.push('pt-4');
    }
    if (asInlineQuote) classNames.push('inline-quote border-2 border-neutral-900 rounded-lg my-2');
    if (fullWidth) classNames.push('full-width');

    return classNames.join(' ');
  }, [standalone, isQuote, isQuoting, asInlineQuote, fullWidth]);

  useEffect(() => {
    const comparator = (a: { key: string; value: Event }, b: { key: string; value: Event }) => {
      const aEvent = a.value;
      const bEvent = b.value;
      if (!aEvent && !bEvent) return 0;
      if (!aEvent) return -1;
      if (!bEvent) return 1;
      return aEvent.created_at - bEvent.created_at;
    };

    const sortedRepliesMap = new SortedMap<string, Event>(comparator);

    const callback = (reply) => {
      if (getEventReplyingTo(reply) !== event.id) return;
      sortedRepliesMap.set(reply.id, reply);
      const sortedReplies = Array.from(sortedRepliesMap.keys()).slice(0, showReplies);
      setReplies(sortedReplies);
    };

    const unsubscribe = PubSub.subscribe({ '#e': [event.id], kinds: [1] }, callback, false);

    return () => {
      unsubscribe();
    };
  }, [event.id, showReplies]);

  let rootMsg = getEventRoot(event);
  if (!rootMsg) {
    rootMsg = meta.replyingTo;
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

  const repliedMsg = (
    <Show when={meta.replyingTo && showRepliedMsg}>
      <EventComponent
        key={event.id + meta.replyingTo}
        id={meta.replyingTo}
        isQuote={true}
        showReplies={0}
      />
    </Show>
  );

  const showThreadBtn = (
    <Show when={!standalone && !isReply && !isQuoting && rootMsg}>
      <Link
        className="text-iris-blue text-sm block mb-2"
        href={`/${Key.toNostrBech32Address(rootMsg || '', 'note')}`}
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
            wot={wot}
          />
        </div>
      </div>
      <Show when={!(isQuote || asInlineQuote)}>
        <hr className="opacity-10" />
      </Show>
      <InfiniteScroll>
        {replies.map((r) => (
          <EventComponent key={r} id={r} isReply={true} isQuoting={!standalone} showReplies={1} />
        ))}
      </InfiniteScroll>
    </>
  );
};

export default Note;
