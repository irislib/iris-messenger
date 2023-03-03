import { html } from 'htm/preact';

import Helpers from '../../Helpers';
import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

export default function Like(props) {
  const likedId = props.event.tags?.reverse().find((t) => t[0] === 'e')[1];
  const likedEvent = Events.cache.get(likedId);
  let text = likedEvent?.content;
  if (text && text.length > 50) {
    text = Helpers.highlightText(text, likedEvent);
  } else {
    text = Helpers.highlightText(text, likedEvent);
  }
  const link = `/post/${Key.toNostrBech32Address(likedId, 'note')}`;
  const userLink = `/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`;
  return html`
    <div class="msg">
      <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
        <div
          style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
        >
          <i class="like-btn liked" style="margin-right: 15px;"> ${Icons.heartFull} </i>
          <a href=${userLink} style="margin-right: 5px;">
            <${Name} pub=${props.event.pubkey} userNameOnly=${true} />
          </a>
          <span>
            liked your <a href=${link}>note</a> ${text && text.length
              ? html`<i>"${text}"</i>`
              : ''}</span
          >
        </div>
      </div>
    </div>
  `;
}
