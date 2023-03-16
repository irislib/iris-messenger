import { useEffect, useState } from 'react';
import { html } from 'htm/preact';
import { route } from 'preact-router';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

import EventComponent from './EventComponent';

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
  const likedEvent = Events.db.by('id', likedId);
  const authorIsYou = likedEvent?.pubkey === Key.getPubKey();
  const mentioned = likedEvent?.tags.find((tag) => tag[0] === 'p' && tag[1] === Key.getPubKey());
  const likeText = authorIsYou
    ? 'liked your note'
    : mentioned
    ? 'liked a note where you were mentioned'
    : 'liked a note';

  useEffect(() => {
    const unsub = Events.getRepliesAndReactions(likedId, (_replies, likedBy) => {
      setAllLikes(Array.from(likedBy));
    });
    return () => unsub();
  }, []);

  const userLink = `/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`;
  return html`
    <div class="msg" key=${props.event.id}>
      <div class="msg-content" onClick=${(e) => messageClicked(e, likedId)}>
        <div>
          <div style="display: flex; align-items: center;">
            <i class="like-btn liked" style="margin-right: 15px;"> ${Icons.heartFull} </i>
            <div>
              <a href=${userLink} style="margin-right: 5px;">
                <${Name} pub=${props.event.pubkey} userNameOnly=${true} />
              </a>
              ${allLikes.length > 1 && html` and ${allLikes.length - 1} others `} ${likeText}
            </div>
          </div>
          <${EventComponent} key=${likedId + props.event.id} id=${likedId} />
        </div>
      </div>
    </div>
  `;
}
