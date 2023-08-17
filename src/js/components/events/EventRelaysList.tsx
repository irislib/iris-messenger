import { FC, useEffect, useState } from 'react';
import { Event } from 'nostr-tools';

import Events from '../../nostr/Events';
import { EventMetadata } from '../../nostr/EventsMeta';
import { translate as t } from '../../translations/Translation.mjs';

const EventRelaysList: FC<{ event: Event }> = ({ event }) => {
  const [eventMeta, setEventMeta] = useState(null as null | EventMetadata);

  useEffect(() => {
    if (!event?.id) {
      return;
    }
    const id = Events.getOriginalPostEventId(event);
    const val = id && Events.eventsMetaDb.get(id);
    if (val) {
      setEventMeta(val);
    }
  }, [event]);

  const relays = Array.from(eventMeta?.relays || []) as string[];

  return (
    <div className="flex flex-col">
      <h2>{t('event_detail')}</h2>
      <p>{t('seen_on')}</p>
      {relays.length === 0 ? (
        <p>{t('iris_api_source')}</p>
      ) : (
        <ul className="space-y-2">
          {relays.map((r) => (
            <li className="text-lg">{r}</li>
          ))}
        </ul>
      )}
      <pre className="overflow-auto bg-gray-800 rounded p-2 max-h-96 font-mono">
        <code>{JSON.stringify({ ...event }, null, 2)}</code>
      </pre>
    </div>
  );
};

export default EventRelaysList;
