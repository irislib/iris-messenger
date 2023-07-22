import { memo } from 'react';
import { useEffect, useState } from 'preact/hooks';

import Helpers from '../../../Helpers';
import localState from '../../../LocalState';
import SocialNetwork from '../../../nostr/SocialNetwork';
import { translate as t } from '../../../translations/Translation.mjs';
import Show from '../../helpers/Show';
import ImageModal from '../../modal/Image';
import PublicMessageForm from '../../PublicMessageForm';
import Torrent from '../../Torrent';
import Reactions from '../buttons/ReactionButtons';

import Author from './Author';
import Helmet from './Helmet';
import ReplyingToUsers from './ReplyingToUsers';

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

const MSG_TRUNCATE_LENGTH = 500;
const MSG_TRUNCATE_LINES = 8;

const Content = ({ standalone, isQuote, fullWidth, isQuoting, asInlineQuote, event, meta }) => {
  const [translatedText, setTranslatedText] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [name, setName] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (standalone) {
      return SocialNetwork.getProfile(event.pubkey, (profile) => {
        setName(profile?.display_name || profile?.name || '');
      });
    }
  }, [event.pubkey]);

  const emojiOnly = event.content?.length === 2 && Helpers.isEmoji(event.content);

  let text = event.content || '';

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

  function imageClicked(e) {
    e.preventDefault();
    setShowImageModal(true);
  }

  function isTooLong() {
    return (
      attachments?.length > 1 ||
      event.content?.length > MSG_TRUNCATE_LENGTH ||
      event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  return (
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
      <Show when={showImageModal}>
        <ImageModal
          images={attachments?.map((a) => a.data)}
          onClose={() => setShowImageModal(false)}
        />
      </Show>
    </div>
  );
};

export default memo(Content);
