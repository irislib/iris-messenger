import { memo } from 'react';
import { validateEvent, verifySignature } from 'nostr-tools';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Key from '../nostr/Key';
import Helpers from '../utils/Helpers';
import { DecryptedEvent } from '../views/chat/ChatMessages';

import Name from './user/Name';
import HyperText from './HyperText';
import RelativeTime from './RelativeTime';

type Props = {
  event: DecryptedEvent;
  selfAuthored?: boolean;
  showName?: boolean;
};

const PrivateMessage = ({ event, selfAuthored, showName }: Props) => {
  const [text, setText] = useState(event.text || '');
  const [innerEvent, setInnerEvent] = useState<any>(null as any);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let initialText = text;
    if (!initialText) {
      Key.decryptMessage(event, (decryptedText) => {
        initialText = decryptedText;
        checkTextForJson(initialText);
      });
    } else {
      checkTextForJson(initialText);
    }
  }, [event.id, text]);

  const checkTextForJson = (textContent) => {
    try {
      const maybeJson = textContent.slice(textContent.indexOf('{'));
      const e = JSON.parse(maybeJson);
      if (validateEvent(e) && verifySignature(e)) {
        console.log(111, e.tags.length === 1, e.tags[0][0] === 'p', e.tags[0][1] === e.pubkey);
        if (e.tags.length === 1 && e.tags[0][0] === 'p' && e.tags[0][1] === event.pubkey) {
          e.text = e.content;
          setInnerEvent(e);
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    setChecked(true);
    setText(textContent);
  };

  if (innerEvent) {
    return (
      <PrivateMessage
        event={innerEvent}
        showName={true}
        selfAuthored={innerEvent.pubkey === Key.getPubKey()}
      />
    );
  }

  if (!checked) {
    return null;
  }

  const onNameClick = () => {
    route(`/${Key.toNostrBech32Address(event.pubkey, 'npub')}`);
  };

  const emojiOnly = text && text.length === 2 && Helpers.isEmoji(text);
  // TODO opts.onImageClick show image in modal

  const status: any = ''; // this.getSeenStatus();
  const seen = status.seen ? 'text-green-500' : 'text-neutral-500';
  const delivered = status.delivered ? 'border-green-500' : 'border-neutral-500';
  const whose = selfAuthored
    ? 'self-end bg-iris-blue text-white'
    : 'self-start bg-neutral-700 text-white';

  return (
    <div
      className={`p-2 w-full md:w-2/3 rounded-xl mb-1 ${whose} ${seen} ${delivered} flex flex-col items-start`}
    >
      <div className="w-full">
        <div className="mb-2">
          {showName && (
            <small onClick={onNameClick} className="cursor-pointer text-xs">
              <Name key={event.pubkey} pub={event.pubkey} />
            </small>
          )}
        </div>
        <div className={`preformatted-wrap text-base ${emojiOnly ? 'text-4xl' : ''}`}>
          <HyperText event={event}>{text}</HyperText>
        </div>
        <div className={`${selfAuthored ? 'text-right' : 'text-left'} text-xs text-white`}>
          <RelativeTime date={new Date(event.created_at * 1000)} />
        </div>
      </div>
    </div>
  );
};

export default memo(PrivateMessage);
