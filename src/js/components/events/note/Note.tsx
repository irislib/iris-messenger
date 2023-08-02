import { useMemo } from 'react';
import { debounce } from 'lodash';
import { useEffect, useState } from 'preact/hooks';
import { Link, route } from 'preact-router';

import Events from '../../../nostr/Events';
import Key from '../../../nostr/Key';
import { translate as t } from '../../../translations/Translation.mjs';
import For from '../../helpers/For';
import Show from '../../helpers/Show';
import EventComponent from '../EventComponent';

import Avatar from './Avatar';
import Content from './Content';

import useVerticeMonitor from '../../../dwotr/components/useVerticeMonitor';
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
    if (showReplies) {
      return Events.getReplies(
        event.id,
        debounce(
          (replies) => {
            const arr = Array.from(replies).slice(0, showReplies) as string[];
            arr.sort((a, b) => {
              const aEvent = Events.db.by('id', a);
              const bEvent = Events.db.by('id', b);
              return aEvent.created_at - bEvent.created_at;
            });
            setReplies(arr);
          },
          500,
          { leading: true, trailing: true },
        ),
      );
    }
  }, [event.id, showReplies]);

  let rootMsg = Events.getEventRoot(event);
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
            meta={meta}
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
      <For each={replies}>
        {(r) => (
          <EventComponent key={r} id={r} isReply={true} isQuoting={!standalone} showReplies={1} />
        )}
      </For>
    </>
  );
};

export default Note;
