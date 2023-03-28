import { useEffect, useState } from 'react';

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
    }, []);
  }

  return (
    <div className="msg">
      <div className="msg-content" style={{ padding: '12px 0 0 0' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', flexBasis: '100%', marginLeft: '15px' }}
        >
          <small className="reposted">
            <i>{Icons.repost}</i>
            <a href={`/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`}>
              <Name pub={props.event?.pubkey} hideBadge={true} userNameOnly={true} />
            </a>
            <span style={{ marginLeft: '5px' }}>
              {allReposts.length > 1 && `and ${allReposts.length - 1} others`} {t('reposted')}
            </span>
          </small>
        </div>
        <EventComponent key={repostedEventId + props.event.id} id={repostedEventId} />
      </div>
    </div>
  );
}
