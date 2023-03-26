import { useState } from 'react';
import { html } from 'htm/preact';
import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';

import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

import EventComponent from './EventComponent';

const lightningIcon = html`<svg width="24" height="20" viewBox="0 0 16 20" fill="none">
  <path
    d="M8.8333 1.70166L1.41118 10.6082C1.12051 10.957 0.975169 11.1314 0.972948 11.2787C0.971017 11.4068 1.02808 11.5286 1.12768 11.6091C1.24226 11.7017 1.46928 11.7017 1.92333 11.7017H7.99997L7.16663 18.3683L14.5888 9.46178C14.8794 9.11297 15.0248 8.93857 15.027 8.79128C15.0289 8.66323 14.9719 8.54141 14.8723 8.46092C14.7577 8.36833 14.5307 8.36833 14.0766 8.36833H7.99997L8.8333 1.70166Z"
    stroke="currentColor"
    stroke-width="1.66667"
    stroke-linecap="round"
    stroke-linejoin="round"
  ></path>
</svg>`;

const messageClicked = (e, zappedId) => {
  if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => e.target.closest(tag))) {
    return;
  }
  if (window.getSelection().toString()) {
    return;
  }
  e.stopPropagation();
  route(`/${Key.toNostrBech32Address(zappedId, 'note')}`);
};

export default function Zap(props) {
  const [allZaps, setAllZaps] = useState([]);
  const zappedId = Events.getEventReplyingTo(props.event);
  const zappedEvent = Events.db.by('id', zappedId);
  const authorIsYou = zappedEvent?.pubkey === Key.getPubKey();
  const mentioned = zappedEvent?.tags?.find((tag) => tag[0] === 'p' && tag[1] === Key.getPubKey());
  const zappedText = authorIsYou
    ? 'zapped your note'
    : mentioned
    ? 'zapped a note where you were mentioned'
    : 'zapped a note';

  useEffect(() => {
    const unsub = Events.getRepliesAndReactions(zappedId, (_a, _b, _c, _d, zappedBy) => {
      setAllZaps(Array.from(zappedBy.values()));
    });
    return () => unsub();
  }, []);

  let zappingUser = null;
  try {
    zappingUser = Events.getZappingUser(props.event.id);
  } catch (e) {
    console.error('no zapping user found for event', props.event.id, e);
    return '';
  }
  const userLink = `/${zappingUser}`;
  return html`
    <div class="msg">
      <div class="msg-content" onClick=${(e) => messageClicked(e, zappedId)}>
        <div>
          <div style="display: flex; align-items: center;">
            <i class="zap-btn zapped" style="margin-right: 15px;"> ${lightningIcon} </i>
            <div>
              <a href=${userLink} style="margin-right: 5px;">
                <${Name} pub=${zappingUser} userNameOnly=${true} />
              </a>
              ${allZaps.length > 1 ? html`<span> and ${allZaps.length - 1} others </span>` : ''}
              ${zappedText}
            </div>
          </div>
          <${EventComponent} key=${zappedId + props.event.id} id=${zappedId} />
        </div>
      </div>
    </div>
  `;
}
