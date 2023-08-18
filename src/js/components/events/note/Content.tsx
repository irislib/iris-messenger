import { memo } from 'react';
import { useEffect, useState } from 'preact/hooks';

import CreateNoteForm from '@/components/create/CreateNoteForm';
import Reactions from '@/components/events/buttons/ReactionButtons';
import Show from '@/components/helpers/Show';
import HyperText from '@/components/HyperText';
import localState from '@/LocalState';
import SocialNetwork from '@/nostr/SocialNetwork';
import { translate as t } from '@/translations/Translation.mjs';
import Helpers from '@/utils/Helpers.tsx';

import Author from './Author';
import Helmet from './Helmet';

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

type Props = {
  standalone?: boolean;
  isQuote?: boolean;
  fullWidth?: boolean;
  asInlineQuote?: boolean;
  event: any;
  isPreview?: boolean;
};

const Content = ({ standalone, isQuote, fullWidth, asInlineQuote, event, isPreview }: Props) => {
  const [translatedText, setTranslatedText] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [name, setName] = useState('');

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
    text.length > MSG_TRUNCATE_LENGTH && !showMore && !standalone && !isPreview
      ? `${text.slice(0, MSG_TRUNCATE_LENGTH)}...`
      : text;

  const lines = text.split('\n');
  text =
    lines.length > MSG_TRUNCATE_LINES && !showMore && !standalone && !isPreview
      ? `${lines.slice(0, MSG_TRUNCATE_LINES).join('\n')}...`
      : text;

  function isTooLong() {
    return (
      attachments?.length > 1 ||
      event.content?.length > MSG_TRUNCATE_LENGTH ||
      event.content.split('\n').length > MSG_TRUNCATE_LINES
    );
  }

  return (
    <div className={`flex-grow`}>
      <Author
        isPreview={isPreview}
        standalone={standalone}
        event={event}
        isQuote={isQuote}
        fullWidth={fullWidth}
        setTranslatedText={setTranslatedText}
      />
      <Show when={standalone}>
        <Helmet name={name} text={text} attachments={attachments} />
      </Show>
      <Show when={text?.length > 0}>
        <div
          className={`preformatted-wrap pb-1 ${emojiOnly && 'text-2xl'} ${
            fullWidth ? 'full-width-note' : ''
          } ${asInlineQuote ? 'inline-quote' : ''} ${wot?.option}`}
        >
          <HyperText event={event}>{text}</HyperText>
          <Show when={translatedText}>
            <p>
              <i>{translatedText}</i>
            </p>
          </Show>
        </div>
      </Show>
      <Show when={!isPreview && !asInlineQuote && !standalone && isTooLong()}>
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
      <Show when={!isPreview && !asInlineQuote && loadReactions}>
        <Reactions
          key={event.id + 'reactions'}
          settings={{ showLikes, showZaps, showReposts }}
          standalone={standalone}
          event={event}
          wot={wot}
        />
      </Show>
      <Show when={isQuote && !loadReactions}>
        <div style={{ marginBottom: '15px' }}></div>
      </Show>
      <Show when={standalone}>
        <hr className="-mx-2 opacity-10 my-2" />
        <CreateNoteForm
          autofocus={!standalone}
          replyingTo={event.id}
          placeholder={t('write_your_reply')}
        />
      </Show>
    </div>
  );
};

export default memo(Content);
