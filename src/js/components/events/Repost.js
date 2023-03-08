import { useEffect, useState } from 'react';
import { html } from 'htm/preact';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Name from '../Name';

import EventComponent from './EventComponent';

export default function Repost(props) {
  const [allReposts, setAllReposts] = useState([]);
  const repostedEventId = Events.getRepostedEventId(props.event);

  if (props.notification) {
    useEffect(() => {
      const unsub = Events.getRepliesAndReactions(repostedEventId, (_a, _b, _c, repostedBy) => {
        setAllReposts(Array.from(repostedBy));
      });
      return () => unsub();
    });
  }

  return html`
    <div class="msg">
      <div class="msg-content" style="padding: 12px 0 0 0;">
        <div style="display: flex; align-items: center; flex-basis: 100%; margin-left: 15px">
          <small class="reposted">
            <i> ${Icons.repost} </i>
            <a href="/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}">
              <${Name} pub=${props.event?.pubkey} hideBadge=${true} userNameOnly=${true} />
            </a>
            <span style="margin-left: 5px">
              ${allReposts.length > 1 && html`and ${allReposts.length - 1} others`} ${t('reposted')}
            </span>
          </small>
        </div>
        <${EventComponent} key=${repostedEventId + props.event.id} id=${repostedEventId} />
      </div>
    </div>
  `;
}
