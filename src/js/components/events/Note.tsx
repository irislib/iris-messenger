import { Helmet } from 'react-helmet';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Identicon from '../Identicon';
import ImageModal from '../modal/Image';
import Name from '../Name';
import PublicMessageForm from '../PublicMessageForm';
import Torrent from '../Torrent';

import EventComponent from './EventComponent';
import EventDropdown from './EventDropdown';
import Reactions from './Reactions';

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
  name,
  meta,
  asInlineQuote,
  isReply, // message that is rendered under a standalone message, separated by a small margin
  isQuote, // message that connects to the next message with a line
  isQuoting, // message that is under an isQuote message, no margin
  showReplies,
  showRepliedMsg,
  standalone,
}) => {
  const [showMore, setShowMore] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [replies, setReplies] = useState([]);
  const [translatedText, setTranslatedText] = useState('');
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

  // TODO fetch replies in useEffect

  let text = event.content || '';
  meta = meta || {};
  const attachments = [];
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
  const ogImageUrl = standalone && attachments?.find((a) => a.type === 'image')?.data;
  const emojiOnly = event.content?.length === 2 && Helpers.isEmoji(event.content);
  const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
  const quotedShortText = `"${shortText}"`;

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

  const time = new Date(event.created_at * 1000);
  const dateStr = time.toLocaleString(window.navigator.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = time.toLocaleTimeString(window.navigator.language, {
    timeStyle: 'short',
  });

  let rootMsg = Events.getEventRoot(event);
  if (!rootMsg) {
    rootMsg = meta.replyingTo;
  }

  let replyingToUsers = [];
  const hasETags = event.tags?.some((t) => t[0] === 'e');
  if (hasETags) {
    replyingToUsers = event?.tags.filter((t) => t[0] === 'p').map((t) => t[1]);
  }
  // remove duplicates
  replyingToUsers = [...new Set(replyingToUsers)];

  function imageClicked(event) {
    event.preventDefault();
    setShowImageModal(true);
  }

  function messageClicked(event) {
    if (standalone) {
      return;
    }
    if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => event.target.closest(tag))) {
      return;
    }
    if (window.getSelection().toString()) {
      return;
    }
    event.stopPropagation();
    if (event.kind === 7) {
      const likedId = event.tags?.reverse().find((t) => t[0] === 'e')[1];
      return route(`/${likedId}`);
    }
    openStandalone();
  }

  function openStandalone() {
    route(`/${Key.toNostrBech32Address(event.id, 'note')}`);
  }

  function renderDropdown() {
    return asInlineQuote ? null : (
      <EventDropdown id={event.id} event={event} onTranslate={setTranslatedText} />
    );
  }

  function renderReplyingTo() {
    return (
      <small className="msg-replying-to">
        {t('replying_to') + ' '}
        {replyingToUsers.slice(0, 3).map((u) => (
          <a href={`/${Key.toNostrBech32Address(u, 'npub')}`}>
            @<Name pub={u} hideBadge={true} userNameOnly={true} />{' '}
          </a>
        ))}
        {replyingToUsers?.length > 3 ? '...' : ''}
      </small>
    );
  }

  function renderHelmet() {
    const title = `${name || 'User'} on Iris`;
    return (
      <Helmet titleTemplate="%s">
        <title>{`${title}: ${quotedShortText}`}</title>
        <meta name="description" content={quotedShortText} />
        <meta property="og:type" content="article" />
        {ogImageUrl ? <meta property="og:image" content={ogImageUrl} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={quotedShortText} />
      </Helmet>
    );
  }

  function renderImageModal() {
    const images = attachments?.map((a) => a.data);
    return <ImageModal images={images} onClose={() => setShowImageModal(false)} />;
  }

  function renderShowThread() {
    return (
      <div style={{ flexBasis: '100%', marginBottom: '12px' }}>
        <a href={`/${Key.toNostrBech32Address(rootMsg, 'note')}`}>{t('show_thread')}</a>
      </div>
    );
  }

  function renderRepliedMsg() {
    return (
      <EventComponent
        key={event.id + meta.replyingTo}
        id={meta.replyingTo}
        isQuote={true}
        showReplies={0}
      />
    );
  }

  function isTooLong() {
    return (
      attachments?.length > 1 ||
      event.content?.length > MSG_TRUNCATE_LENGTH ||
      event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  function renderIdenticon(isQuote) {
    return (
      <div className="msg-identicon">
        {event.pubkey ? (
          <a href={`/${event.pubkey}`}>
            <Identicon str={Key.toNostrBech32Address(event.pubkey, 'npub')} width={40} />
          </a>
        ) : (
          ''
        )}
        {(isQuote && !standalone && <div className="line"></div>) || ''}
      </div>
    );
  }

  function renderMsgSender() {
    return (
      <div className="msg-sender">
        <div className="msg-sender-link">
          <a href={`/${Key.toNostrBech32Address(event.pubkey, 'npub')}`} className="msgSenderName">
            <Name pub={event.pubkey} />
          </a>
          <div className="time">
            {'· '}
            <a href={`/${Key.toNostrBech32Address(event.id, 'note')}`} className="tooltip">
              {time && Helpers.getRelativeTimeText(time)}
              <span className="tooltiptext">
                {' '}
                {dateStr} {timeStr}{' '}
              </span>
            </a>
          </div>
        </div>
        {renderDropdown()}
      </div>
    );
  }

  function getClassName() {
    const classNames = ['msg'];

    if (standalone) classNames.push('standalone');
    if (isQuote) classNames.push('quote');
    if (isQuoting) classNames.push('quoting');
    if (asInlineQuote) classNames.push('inline-quote');

    return classNames.join(' ');
  }

  function renderReplies() {
    return replies
      .slice(0, showReplies)
      .map((r) => (
        <EventComponent key={r} id={r} isReply={true} isQuoting={!standalone} showReplies={1} />
      ));
  }

  function renderReplyForm() {
    return (
      <PublicMessageForm
        waitForFocus={true}
        autofocus={!standalone}
        replyingTo={event.id}
        replyingToUser={event.pubkey}
        placeholder={t('write_your_reply')}
      />
    );
  }

  return (
    <>
      {meta.replyingTo && showRepliedMsg && renderRepliedMsg()}
      <div key={event.id + 'note'} className={getClassName()} onClick={(e) => messageClicked(e)}>
        <div className="msg-content" onClick={(e) => messageClicked(e)}>
          {!standalone && !isReply && !isQuoting && rootMsg && renderShowThread()}
          {renderIdenticon(isQuote)}
          <div className="msg-main">
            {renderMsgSender()}
            {(replyingToUsers?.length && !isQuoting && renderReplyingTo()) || null}
            {standalone && renderHelmet()}
            {meta.torrentId && <Torrent torrentId={meta.torrentId} autopause={!standalone} />}
            {text?.length > 0 && (
              <div className={`text ${emojiOnly && 'emoji-only'}`}>
                {text}
                {translatedText && (
                  <p>
                    <i>{translatedText}</i>
                  </p>
                )}
              </div>
            )}
            {!asInlineQuote && !standalone && isTooLong() && (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setShowMore(!showMore);
                }}
              >
                {t(`show_${showMore ? 'less' : 'more'}`)}
              </a>
            )}
            {meta.url && (
              <a href={meta.url} target="_blank" rel="noopener noreferrer">
                {meta.url}
              </a>
            )}
            {!asInlineQuote && loadReactions && (
              <Reactions
                key={event.id + 'reactions'}
                settings={{ showLikes, showZaps, showReposts }}
                standalone={standalone}
                event={event}
                setReplies={(replies) => setReplies(replies)}
              />
            )}
            {isQuote && !loadReactions && <div style={{ marginBottom: '15px' }}></div>}
            {standalone && renderReplyForm()}
          </div>
        </div>
      </div>
      {showImageModal && renderImageModal()}
      {renderReplies()}
    </>
  );
};

export default Note;
