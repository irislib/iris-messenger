import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Event } from 'nostr-tools';

import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import { translate as t } from '../../translations/Translation.mjs';
import Name from '../user/Name';

import EventComponent from './EventComponent';

interface Props {
  event: Event;
  notification?: boolean;
  fullWidth?: boolean;
}

export default function Repost(props: Props) {
  const [allReposts, setAllReposts] = useState<string[]>([]);
  const repostedEventId = Events.getRepostedEventId(props.event) || '';

  useEffect(() => {
    if (props.notification) {
      const unsub = Events.getReposts(repostedEventId, (repostedBy: Set<string>) => {
        setAllReposts(Array.from(repostedBy));
      });
      return () => unsub();
    }
  }, [props.notification, repostedEventId]);

  return (
    <div className="msg">
      <div className="msg-content" style={{ padding: '12px 0 0 0' }}>
        <div className="flex gap-1 items-center text-sm text-neutral-500">
          <i>
            <ArrowPathIcon width={18} />
          </i>
          <a href={`/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`}>
            <Name pub={props.event?.pubkey} hideBadge={true} />
          </a>
          <span>
            {allReposts.length > 1 && `and ${allReposts.length - 1} others`} {t('reposted')}
          </span>
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
