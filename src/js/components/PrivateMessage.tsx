import $ from 'jquery';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Helpers from '../Helpers';
import Key from '../nostr/Key';

import Name from './Name';
import Torrent from './Torrent';

const PrivateMessage = (props) => {
  const [text, setText] = useState('');

  useEffect(() => {
    $('a').click((e) => {
      const href = $(e.target).attr('href');
      if (href && href.indexOf('https://iris.to/') === 0) {
        e.preventDefault();
        route(href.replace('https://iris.to/', ''));
      }
    });
    Key.decryptMessage(props.id, (decryptedText) => {
      setText(decryptedText);
    });
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
  const seen = status.seen ? 'seen' : '';
  const delivered = status.delivered ? 'delivered' : '';
  const whose = props.selfAuthored ? 'our' : 'their';

  return (
    <div className={`msg ${whose} ${seen} ${delivered}`}>
      <div class="msg-content">
        <div class="msg-sender">
          {props.showName && (
            <small onClick={onNameClick} class="msgSenderName">
              <Name key={props.pubkey} pub={props.pubkey} />
            </small>
          )}
        </div>
        {props.torrentId && <Torrent torrentId={props.torrentId} />}
        <div class={`text ${emojiOnly && 'emoji-only'}`}>{formattedText}</div>
        <div class="below-text">
          <div class="time">
            {props.id ? Helpers.getRelativeTimeText(time) : Helpers.formatTime(time)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateMessage;
