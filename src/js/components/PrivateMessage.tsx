import { memo } from 'react';
import $ from 'jquery';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Helpers from '../Helpers';
import Key from '../nostr/Key';

import Name from './user/Name';
import Torrent from './Torrent';

const PrivateMessage = (props) => {
  const [text, setText] = useState(props.text || '');

  useEffect(() => {
    $('a').click((e) => {
      const href = $(e.target).attr('href');
      if (href && href.indexOf('https://iris.to/') === 0) {
        e.preventDefault();
        route(href.replace('https://iris.to/', ''));
      }
    });
    if (!text) {
      Key.decryptMessage(props.id, (decryptedText) => {
        setText(decryptedText);
      });
    }
  }, [props.id]);

  const onNameClick = () => {
    route(`/${Key.toNostrBech32Address(props.pubkey, 'npub')}`);
  };

  const emojiOnly = text && text.length === 2 && Helpers.isEmoji(text);
  const formattedText = Helpers.highlightEverything(text || '');
  // TODO opts.onImageClick show image in modal

  const time =
    typeof props.created_at === 'object' ? props.created_at : new Date(props.created_at * 1000);

  const status: any = ''; // this.getSeenStatus();
  const seen = status.seen ? 'text-green-500' : 'text-gray-500';
  const delivered = status.delivered ? 'border-green-500' : 'border-gray-500';
  const whose = props.selfAuthored ? 'bg-iris-blue text-white' : 'bg-neutral-900 text-white';

  return (
    <div className={`p-2 rounded-lg m-2 ${whose} ${seen} ${delivered}`}>
      <div>
        <div className="mb-2">
          {props.showName && (
            <small onClick={onNameClick} className="cursor-pointer text-xs">
              <Name key={props.pubkey} pub={props.pubkey} />
            </small>
          )}
        </div>
        {props.torrentId && <Torrent torrentId={props.torrentId} />}
        <div className={`text-base ${emojiOnly ? 'text-4xl' : ''}`}>{formattedText}</div>
        <div className="text-right text-xs text-gray-400">
          {props.id ? Helpers.getRelativeTimeText(time) : Helpers.formatTime(time)}
        </div>
      </div>
    </div>
  );
};

export default memo(PrivateMessage);
