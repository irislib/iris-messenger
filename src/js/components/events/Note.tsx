import { Helmet } from 'react-helmet';
import { useEffect, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import FeedMessageForm from '../FeedMessageForm';
import Identicon from '../Identicon';
import ImageModal from '../modal/Image';
import Name from '../Name';
import Torrent from '../Torrent';

import EventComponent from './EventComponent';
import EventDropdown from './EventDropdown';
import Reactions from './Reactions';

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

let loadReactions = true;
localState
  .get('settings')
  .get('loadReactions')
  .on((v) => (loadReactions = v));

const Note = ({
  event,
  name,
  meta,
  asInlineQuote,
  asQuote,
  asReply,
  showReplies,
  showRepliedMsg,
  standalone,
}) => {
  const [state, setState] = useState({
    content: '' as any,
    dateStr: undefined,
    emojiOnly: undefined,
    lightning: undefined,
    lines: undefined,
    meta,
    name,
    ogImageUrl: undefined,
    quotedShortText: '',
    replyingToUsers: [],
    replies: [],
    rootMsg: undefined,
    shortContent: undefined,
    shortText: '',
    showImageModal: false,
    showMore: false,
    showReplyForm: false,
    text: undefined,
    time: undefined,
    timeStr: undefined,
    title: '',
    translatedText: undefined,
  });

  const subscriptions: any[] = [];
  const ref = useRef(null);

  // ... other functions ...

  useEffect(() => {
    const unsub = SocialNetwork.getProfile(event.pubkey, (profile) => {
      if (!profile) return;
      const lightning = profile.lud16 || profile.lud06;
      setState({
        ...state,
        lightning,
        name: profile.display_name || profile.name,
      });
    });
    subscriptions.push(unsub);

    // find .jpg .jpeg .gif .png .webp urls in msg.text and add them to msg.attachments
    let text = event.content;
    meta = meta || {};
    meta.attachments = [];
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
          meta.attachments.push({ type: 'image', data: `${parsedUrl.href}` });
        }
      });
    }
    const ogImageUrl = standalone && meta.attachments?.find((a) => a.type === 'image')?.data;
    const emojiOnly = event.content?.length === 2 && Helpers.isEmoji(event.content);
    const shortText = text.length > 128 ? `${text.slice(0, 128)}...` : text;
    const quotedShortText = `"${shortText}"`;

    const content = Helpers.highlightEverything(text.trim(), event, {
      showMentionedMessages: !asInlineQuote,
      onImageClick: (e) => imageClicked(e),
    });
    text =
      text.length > MSG_TRUNCATE_LENGTH && !state.showMore && !standalone
        ? `${text.slice(0, MSG_TRUNCATE_LENGTH)}...`
        : text;

    const lines = text.split('\n');
    text =
      lines.length > MSG_TRUNCATE_LINES && !state.showMore && !standalone
        ? `${lines.slice(0, MSG_TRUNCATE_LINES).join('\n')}...`
        : text;

    const shortContent =
      isTooLong() &&
      Helpers.highlightEverything(text.trim(), event, {
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

    setState({
      ...state,
      meta,
      content,
      shortContent,
      replyingToUsers,
      ogImageUrl,
      time,
      timeStr,
      dateStr,
      rootMsg,
      shortText,
      quotedShortText,
      emojiOnly,
      name,
      text,
      lines,
    });

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  });

  function imageClicked(event) {
    event.preventDefault();
    setState({ ...state, showImageModal: true });
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
    return asInlineQuote ? null : <EventDropdown id={event.id} event={event} />;
  }

  function renderReplyingTo() {
    return (
      <small className="msg-replying-to">
        {t('replying_to') + ' '}
        {state.replyingToUsers.slice(0, 3).map((u) => (
          <a href={`/${Key.toNostrBech32Address(u, 'npub')}`}>
            @<Name pub={u} hideBadge={true} userNameOnly={true} />{' '}
          </a>
        ))}
        {state.replyingToUsers?.length > 3 ? '...' : ''}
      </small>
    );
  }

  function renderHelmet() {
    const s = state;
    const title = `${s.name || 'User'} on Iris`;
    return (
      <Helmet titleTemplate="%s">
        <title>{`${title}: ${s.quotedShortText}`}</title>
        <meta name="description" content={s.quotedShortText} />
        <meta property="og:type" content="article" />
        {s.ogImageUrl ? <meta property="og:image" content={s.ogImageUrl} /> : null}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={s.quotedShortText} />
      </Helmet>
    );
  }

  function renderImageModal() {
    const images = meta.attachments?.map((a) => a.data);
    return (
      <ImageModal images={images} onClose={() => setState({ ...state, showImageModal: false })} />
    );
  }

  function renderShowThread() {
    return (
      <div style={{ flexBasis: '100%', marginBottom: '12px' }}>
        <a href={`/${Key.toNostrBech32Address(state.rootMsg, 'note')}`}>{t('show_thread')}</a>
      </div>
    );
  }

  function renderRepliedMsg() {
    return (
      <EventComponent
        key={event.id + meta.replyingTo}
        id={meta.replyingTo}
        asQuote={true}
        showReplies={0}
      />
    );
  }

  function isTooLong() {
    return (
      meta.attachments?.length > 1 ||
      event.content?.length > MSG_TRUNCATE_LENGTH ||
      event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  function renderIdenticon(asQuote) {
    return (
      <div className="msg-identicon">
        {event.pubkey ? (
          <a href={`/${event.pubkey}`}>
            <Identicon str={Key.toNostrBech32Address(event.pubkey, 'npub')} width={40} />
          </a>
        ) : (
          ''
        )}
        {(asQuote && !standalone && <div className="line"></div>) || ''}
      </div>
    );
  }

  function renderMsgSender() {
    const s = state;
    return (
      <div className="msg-sender">
        <div className="msg-sender-link">
          <a href={`/${Key.toNostrBech32Address(event.pubkey, 'npub')}`} className="msgSenderName">
            <Name pub={event.pubkey} />
          </a>
          <div className="time">
            {'· '}
            <a href={`/${Key.toNostrBech32Address(event.id, 'note')}`} className="tooltip">
              {s.time && Helpers.getRelativeTimeText(s.time)}
              <span className="tooltiptext">
                {' '}
                {s.dateStr} {s.timeStr}{' '}
              </span>
            </a>
          </div>
        </div>
        {renderDropdown()}
      </div>
    );
  }

  function getClassName(asQuote, quoting) {
    const classNames = ['msg'];

    if (asReply) classNames.push('reply');
    if (standalone) classNames.push('standalone');
    if (asQuote) classNames.push('quote');
    if (quoting) classNames.push('quoting');
    if (asInlineQuote) classNames.push('inline-quote');

    return classNames.join(' ');
  }

  function renderReplies() {
    return state.replies
      .slice(0, showReplies)
      .map((r) => (
        <EventComponent key={r} id={r} asReply={!standalone} showReplies={showReplies} />
      ));
  }

  function renderReplyForm() {
    return (
      <FeedMessageForm
        waitForFocus={true}
        autofocus={!standalone}
        replyingTo={event.id}
        replyingToUser={event.pubkey}
        placeholder={t('write_your_reply')}
      />
    );
  }

  const quoting = meta.replyingTo && (showRepliedMsg || asReply);

  return (
    <>
      {state.meta.replyingTo && showRepliedMsg && renderRepliedMsg()}
      <div
        key={event.id + 'note'}
        ref={ref}
        className={getClassName(asQuote, quoting)}
        onClick={(e) => messageClicked(e)}
      >
        <div className="msg-content" onClick={(e) => messageClicked(e)}>
          {asQuote && state.rootMsg && renderShowThread()}
          {renderIdenticon(asQuote)}
          <div className="msg-main">
            {renderMsgSender()}
            {(state.replyingToUsers?.length && !quoting && renderReplyingTo()) || null}
            {standalone && renderHelmet()}
            {state.meta.torrentId && (
              <Torrent torrentId={state.meta.torrentId} autopause={!standalone} />
            )}
            {state.text?.length > 0 && (
              <div className={`text ${state.emojiOnly && 'emoji-only'}`}>
                {(!state.showMore && state.shortContent) || state.content}
                {state.translatedText && (
                  <p>
                    <i>{state.translatedText}</i>
                  </p>
                )}
              </div>
            )}
            {!asInlineQuote && state.shortContent && (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setState({ ...state, showMore: !state.showMore });
                }}
              >
                {t(`show_${state.showMore ? 'less' : 'more'}`)}
              </a>
            )}
            {state.meta.url && (
              <a href={state.meta.url} target="_blank" rel="noopener noreferrer">
                {state.meta.url}
              </a>
            )}
            {!asInlineQuote && loadReactions && (
              <Reactions
                standalone={standalone}
                event={event}
                setReplies={(replies) => setState({ ...state, replies })}
              />
            )}
            {standalone && renderReplyForm()}
          </div>
        </div>
      </div>
      {state.showImageModal && renderImageModal()}
      {renderReplies()}
    </>
  );
};

export default Note;
