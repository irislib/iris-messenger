import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import { Event } from '../../lib/nostr-tools';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation';
import Name from '../Name';

import EventComponent from './EventComponent';

interface Props {
  event: Event;
  notification?: boolean;
  fullWidth?: boolean;
}

export default function Repost(props: Props) {
  const [allReposts, setAllReposts] = useState<string[]>([]);
  const repostedEventId = Events.getRepostedEventId(props.event);

  useEffect(() => {
    if (props.notification) {
      const unsub = Events.getRepliesAndReactions(
        repostedEventId,
        (_a: Set<string>, _b: Set<string>, _c: number, repostedBy: Set<string>) => {
          setAllReposts(Array.from(repostedBy));
        },
      );
      return () => unsub();
    }
  }, [props.notification, repostedEventId]);

  return (
    <div className="msg">
      <div className="msg-content" style={{ padding: '12px 0 0 0' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', flexBasis: '100%', marginLeft: '15px' }}
        >
          <small className="reposted">
            <i>
              <ArrowPathIcon width={24} />
            </i>
            <a href={`/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`}>
              <Name pub={props.event?.pubkey} hideBadge={true} />
            </a>
            <span style={{ marginLeft: '5px' }}>
              {allReposts.length > 1 && `and ${allReposts.length - 1} others`} {t('reposted')}
            </span>
          </small>
        </div>
        <EventComponent
          key={repostedEventId + props.event.id}
          id={repostedEventId}
          fullWidth={props.fullWidth}
        />
      </div>
    </div>
  );
}
