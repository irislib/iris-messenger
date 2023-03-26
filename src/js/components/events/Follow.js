import { html } from 'htm/preact';

import Icons from '../../Icons';
import Key from '../../nostr/Key';
import Name from '../Name';

export default function Follow(props) {
  const followsYou = props.event.tags.some((t) => t[0] === 'p' && t[1] === Key.getPubKey());
  const text = followsYou ? 'started following you' : 'updated their following list';
  return html`
    <div class="msg">
      <div class="msg-content">
        <div style="display: flex; align-items: center">
          <i class="repost-btn reposted" style="margin-right: 15px;"> ${Icons.newFollower} </i>
          <a href="/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}">
            <${Name} pub=${props.event.pubkey} />
          </a>
          <span class="mar-left5"> ${text}</span>
        </div>
      </div>
    </div>
  `;
}
