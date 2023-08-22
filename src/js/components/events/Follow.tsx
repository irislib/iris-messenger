import { Event } from 'nostr-tools';
import { Link } from 'preact-router';

import Key from '../../nostr/Key';
import Icons from '../../utils/Icons';
import Name from '../user/Name';

type Props = {
  event: Event;
};

function Follow(props: Props) {
  const followsYou = props.event.tags?.some((t: string[]) => t[0] === 'p' && Key.isMine(t[1]));
  const text = followsYou ? 'started following you' : 'updated their following list';
  return (
    <div className="msg">
      <div className="msg-content">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <i className="repost-btn reposted" style={{ marginRight: 15 }}>
            {Icons.newFollower}
          </i>
          <Link href={`/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`}>
            <Name pub={props.event.pubkey} />
          </Link>
          <span className="mar-left5"> {text}</span>
        </div>
      </div>
    </div>
  );
}

export default Follow;
