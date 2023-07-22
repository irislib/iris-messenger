import { debounce } from 'lodash';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Helpers from '../../../Helpers';
import localState from '../../../LocalState';
import Events from '../../../nostr/Events';
import Key from '../../../nostr/Key';
import SocialNetwork from '../../../nostr/SocialNetwork';
import { translate as t } from '../../../translations/Translation.mjs';
import For from '../../helpers/For';
import Show from '../../helpers/Show';
import ImageModal from '../../modal/Image';
import PublicMessageForm from '../../PublicMessageForm';
import Torrent from '../../Torrent';
import Reactions from '../buttons/ReactionButtons';
import EventComponent from '../EventComponent';

import Author from './Author';
import Avatar from './Avatar';
import Helmet from './Helmet';
import ReplyingToUsers from './ReplyingToUsers';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

let loadReactions = true;
let showLikes = true;
let showZaps = true;
let showReposts = true;
localState.get('settings').on((s) => {
  loadReactions = s.loadReactions !== false;
  showLikes = s.showLikes !== false;
  showZaps = s.showZaps !== false;
  showReposts = s.showReposts !== false;
});

const Note = ({
  event,
  meta,
  asInlineQuote,
  isReply, // message that is rendered under a standalone message, separated by a small margin
  isQuote, // message that connects to the next message with a line
  isQuoting, // message that is under an isQuote message, no margin
  showReplies,
  showRepliedMsg,
  standalone,
  fullWidth,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [replies, setReplies] = useState([] as string[]);
  const [translatedText, setTranslatedText] = useState('');
  const [name, setName] = useState('');
  showReplies = showReplies || 0;
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

  useEffect(() => {
    if (standalone) {
      SocialNetwork.getProfile(event.pubkey, (profile) => {
        setName(profile?.display_name || profile?.name || '');
      });

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
  }, [event.id, standalone, showReplies]);

  let text = event.content || '';
  meta = meta || {};
  const attachments = [] as any[];
  const urls = text.match(/(https?:\/\/[^\s]+)/g);
  if (urls) {
    urls.forEach((url) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        console.log('invalid url', url);
        return;
      }
      if (parsedUrl.pathname.toLowerCase().match(/\.(jpg|jpeg|gif|png|webp)$/)) {
        attachments.push({ type: 'image', data: `${parsedUrl.href}` });
      }
    });
  }
  const emojiOnly = event.content?.length === 2 && Helpers.isEmoji(event.content);

  text =
    text.length > MSG_TRUNCATE_LENGTH && !showMore && !standalone
      ? `${text.slice(0, MSG_TRUNCATE_LENGTH)}...`
      : text;

  const lines = text.split('\n');
  text =
    lines.length > MSG_TRUNCATE_LINES && !showMore && !standalone
      ? `${lines.slice(0, MSG_TRUNCATE_LINES).join('\n')}...`
      : text;

  text = Helpers.highlightEverything(text.trim(), event, {
    showMentionedMessages: !asInlineQuote,
    onImageClick: (e) => imageClicked(e),
  });

  let rootMsg = Events.getEventRoot(event);
  if (!rootMsg) {
    rootMsg = meta.replyingTo;
  }

  function imageClicked(e) {
    e.preventDefault();
    setShowImageModal(true);
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

  function isTooLong() {
    return (
      attachments?.length > 1 ||
      event.content?.length > MSG_TRUNCATE_LENGTH ||
      event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  function getClassName() {
    const classNames = ['msg'];

    if (standalone) {
      classNames.push('standalone');
    } else {
      classNames.push(
        'cursor-pointer transition-all ease-in-out duration-200 hover:bg-neutral-999',
      );
    }
    if (isQuote) classNames.push('quote pb-2');
    if (isQuoting) classNames.push('quoting pt-0');
    if (asInlineQuote) classNames.push('inline-quote border-2 border-neutral-900 rounded-lg my-2');
    if (fullWidth) classNames.push('full-width');

    return classNames.join(' ');
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
      <a
        className="text-iris-blue text-sm block mb-2"
        href={`/${Key.toNostrBech32Address(rootMsg || '', 'note')}`}
      >
        {t('show_thread')}
      </a>
    </Show>
  );

  // TODO extract to component
  const content = (
    <div className="flex-grow">
      <Author
        standalone={standalone}
        event={event}
        isQuote={isQuote}
        fullWidth={fullWidth}
        setTranslatedText={setTranslatedText}
      />
      <ReplyingToUsers event={event} isQuoting={isQuoting} />
      <Show when={standalone}>
        <Helmet name={name} text={text} attachments={attachments} />
      </Show>
      <Show when={meta.torrentId}>
        <Torrent torrentId={meta.torrentId} autopause={!standalone} />
      </Show>
      <Show when={text?.length > 0}>
        <div className={`preformatted-wrap py-2 ${emojiOnly && 'text-2xl'}`}>
          {text}
          <Show when={translatedText}>
            <p>
              <i>{translatedText}</i>
            </p>
          </Show>
        </div>
      </Show>
      <Show when={!asInlineQuote && !standalone && isTooLong()}>
        <a
          className="text-sm link mb-2"
          onClick={(e) => {
            e.preventDefault();
            setShowMore(!showMore);
          }}
        >
          {t(`show_${showMore ? 'less' : 'more'}`)}
        </a>
      </Show>
      <Show when={!asInlineQuote && loadReactions}>
        <Reactions
          key={event.id + 'reactions'}
          settings={{ showLikes, showZaps, showReposts }}
          standalone={standalone}
          event={event}
        />
      </Show>
      <Show when={isQuote && !loadReactions}>
        <div style={{ marginBottom: '15px' }}></div>
      </Show>
      <Show when={standalone}>
        <hr className="-mx-2 opacity-10 my-2" />
        <PublicMessageForm
          waitForFocus={true}
          autofocus={!standalone}
          replyingTo={event.id}
          placeholder={t('write_your_reply')}
        />
      </Show>
    </div>
  );

  return (
    <>
      {repliedMsg}
      <div
        key={event.id + 'note'}
        className={`p-2 ${getClassName()}`}
        onClick={(e) => messageClicked(e)}
      >
        {showThreadBtn}
        <div className="flex flex-row" onClick={(e) => messageClicked(e)}>
          <Show when={!fullWidth}>
            <Avatar event={event} isQuote={isQuote} standalone={standalone} />
          </Show>
          {content}
        </div>
      </div>
      <Show when={!(isQuote || asInlineQuote)}>
        <hr className="-mx-2 opacity-10 mb-2" />
      </Show>
      <Show when={showImageModal}>
        <ImageModal
          images={attachments?.map((a) => a.data)}
          onClose={() => setShowImageModal(false)}
        />
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
