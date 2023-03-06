import { html } from 'htm/preact';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Name from '../Name';

import EventComponent from './EventComponent';

export default function Repost(props) {
  const repostedEventId = Events.getRepostedEventId(props.event);
  return html`
    <div class="msg">
      <div class="msg-content" style="padding: 12px 0 0 0;">
        <div style="display: flex; align-items: center; flex-basis: 100%; margin-left: 15px">
          <small class="reposted">
            <i> ${Icons.repost} </i>
            <a href="/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}">
              <${Name} pub=${props.event?.pubkey} hideBadge=${true} userNameOnly=${true} />
            </a>
            <span style="margin-left: 5px"> ${t('reposted')} </span>
          </small>
        </div>
        <${EventComponent} id=${repostedEventId} />
      </div>
    </div>
  `;
}
