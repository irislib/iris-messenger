import { useEffect, useState } from 'react';
import { html } from 'htm/preact';
import { route } from 'preact-router';

import Helpers from '../../Helpers';
import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

const messageClicked = (e, likedId) => {
  if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => e.target.closest(tag))) {
    return;
  }
  if (window.getSelection().toString()) {
    return;
  }
  e.stopPropagation();
  route(`/${Key.toNostrBech32Address(likedId, 'note')}`);
};

export default function Like(props) {
  const [allLikes, setAllLikes] = useState([]);
  const likedId = Events.getEventReplyingTo(props.event);

  useEffect(() => {
    const unsub = Events.getRepliesAndReactions(likedId, (_replies, likedBy) => {
      setAllLikes(Array.from(likedBy));
    });
    return () => unsub();
  });

  const likedEvent = Events.cache.get(likedId);
  let text = likedEvent?.content;
  if (text && text.length > 50) {
    text = Helpers.highlightText(text, likedEvent);
  } else {
    text = Helpers.highlightText(text, likedEvent);
  }
  const link = `/${Key.toNostrBech32Address(likedId, 'note')}`;
  const userLink = `/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`;
  return html`
    <div class="msg" key=${props.event.id}>
      <div class="msg-content" onClick=${(e) => messageClicked(e, likedId)}>
        <div
          style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
        >
          <i class="like-btn liked" style="margin-right: 15px;"> ${Icons.heartFull} </i>
          <a href=${userLink} style="margin-right: 5px;">
            <${Name} pub=${props.event.pubkey} userNameOnly=${true} />
          </a>
          ${allLikes.length > 1 && html` and ${allLikes.length - 1} others `} liked your
          <a href=${link} class="mar-left5">note</a> ${text && text.length
            ? html`<i>"${text}"</i>`
            : ''}
        </div>
      </div>
    </div>
  `;
}
