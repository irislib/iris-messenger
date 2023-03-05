import { html } from 'htm/preact';

import Helpers from '../../Helpers';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

const lightningIcon = html`<svg width="24" height="20" viewBox="0 0 16 20" fill="none">
  <path
    d="M8.8333 1.70166L1.41118 10.6082C1.12051 10.957 0.975169 11.1314 0.972948 11.2787C0.971017 11.4068 1.02808 11.5286 1.12768 11.6091C1.24226 11.7017 1.46928 11.7017 1.92333 11.7017H7.99997L7.16663 18.3683L14.5888 9.46178C14.8794 9.11297 15.0248 8.93857 15.027 8.79128C15.0289 8.66323 14.9719 8.54141 14.8723 8.46092C14.7577 8.36833 14.5307 8.36833 14.0766 8.36833H7.99997L8.8333 1.70166Z"
    stroke="currentColor"
    stroke-width="1.66667"
    stroke-linecap="round"
    stroke-linejoin="round"
  ></path>
</svg>`;

export default function Zap(props) {
  const likedId = props.event.tags?.reverse().find((t) => t[0] === 'e')?.[1];
  const likedEvent = Events.cache.get(likedId);
  let text = likedEvent?.content;
  if (text && text.length > 50) {
    text = Helpers.highlightText(text, likedEvent);
  } else {
    text = Helpers.highlightText(text, likedEvent);
  }
  let zappingUser = null;
  try {
    zappingUser = Events.getZappingUser(props.event.id);
  } catch (e) {
    console.error('no zapping user found for event', props.event.id, e);
    return '';
  }
  const link = `/post/${Key.toNostrBech32Address(likedId, 'note')}`;
  const userLink = `/${zappingUser}`;
  return html`
    <div class="msg">
      <div class="msg-content" onClick=${(e) => this.messageClicked(e)}>
        <div
          style="display: flex; align-items: center; flex-basis: 100%; white-space: nowrap;text-overflow: ellipsis; overflow:hidden"
        >
          <i class="zap-btn zapped" style="margin-right: 15px;"> ${lightningIcon} </i>
          <a href=${userLink} style="margin-right: 5px;">
            <${Name} pub=${zappingUser} userNameOnly=${true} />
          </a>
          <span>
            zapped your <a href=${link}>note</a> ${text && text.length
              ? html`<i>"${text}"</i>`
              : ''}</span
          >
        </div>
      </div>
    </div>
  `;
}
