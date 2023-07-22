import { memo } from 'react';
import { FireIcon } from '@heroicons/react/24/solid';
import { Event, nip19 } from 'nostr-tools';
import { Link } from 'preact-router';

import Avatar from '../Avatar';
import Name from '../Name';
import RelativeTime from '../RelativeTime';

const SmallFeed = ({ events }: { events: Event[] }) => {
  const mutedUsers = [];
  return (
    <div className="card-body p-4">
      <h2 className="card-title">
        <FireIcon width={20} className="text-iris-orange" />
        Trending 24h
      </h2>

      <hr className="opacity-10" />

      <div className="-ml-2 flex flex-wrap gap-6 text-xs overflow-y-scroll overflow-x-hidden max-h-screen">
        {events
          .filter((event) => !mutedUsers[event.pubkey])
          .map((event) => (
            <div key={event.id} className="flex gap-2 w-full break-words">
              <div className="flex-shrink-0">
                <Link href={`/${nip19.npubEncode(event.pubkey)}`}>
                  <Avatar str={event.pubkey} width={30} />
                </Link>
              </div>
              <Link href={`/${nip19.noteEncode(event.id)}`} className="w-full">
                <b>
                  <Name pub={event.pubkey} />
                </b>
                {' | '}
                <span className="text-neutral-400">
                  <RelativeTime date={new Date(event.created_at * 1000)} />
                  <br />
                  {event.content?.length > 80 ? `${event.content?.slice(0, 80)}...` : event.content}
                </span>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default memo(SmallFeed);
