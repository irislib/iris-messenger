import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Event } from 'nostr-tools';
import { Link } from 'preact-router';

import { getRepostedEventId } from '@/nostr/utils';

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
  const repostedEventId = getRepostedEventId(props.event) || '';

  useEffect(() => {
    if (props.notification) {
      const unsub = Events.getReposts(repostedEventId, (repostedBy: Set<string>) => {
        setAllReposts(Array.from(repostedBy));
      });
      return () => unsub();
    }
  }, [props.notification, repostedEventId]);

  return (
    <div>
      <div className="flex gap-1 items-center text-sm text-neutral-500 px-2 pt-2">
        <i>
          <ArrowPathIcon width={18} />
        </i>
        <Link href={`/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`}>
          <Name pub={props.event?.pubkey} hideBadge={true} />
        </Link>
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
  );
}
