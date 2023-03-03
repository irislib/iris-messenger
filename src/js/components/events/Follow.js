import { html } from 'htm/preact';

import Icons from '../../Icons';
import Key from '../../nostr/Key';
import Name from '../Name';

export default function Follow(props) {
  return html`
    <div class="msg">
      <div class="msg-content">
        <div style="display: flex; align-items: center">
          <i class="repost-btn reposted" style="margin-right: 15px;"> ${Icons.newFollower} </i>
          <a href="/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}">
            <${Name} pub=${props.event.pubkey} />
          </a>
          <span class="mar-left5"> started following you</span>
        </div>
      </div>
    </div>
  `;
}
