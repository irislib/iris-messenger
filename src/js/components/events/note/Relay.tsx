import { Event } from 'nostr-tools';
import { useEffect, useState } from 'react';
import Events from '@/nostr/Events';
import { EventMetadata } from '@/nostr/EventsMeta';
import { getOriginalPostEventId } from '@/nostr/utils.ts';
import { hsl, stringToHue } from '@/utils/Helpers';
const NoteRelaysList = ({ event }: { event: Event }) => {
    
    const [eventMeta, setEventMeta] = useState(null as null | EventMetadata);

    useEffect(() => {
        if (!event?.id) {
        return;
        }
        const id = getOriginalPostEventId(event);
        const val = id && Events.eventsMetaDb.get(id);
        if (val) {
        setEventMeta(val);
        }
    }, [event]);

    const relays = Array.from(eventMeta?.relays || []) as string[];
    //console.log(relays);
    return (
        <div className="flex" style="align-items: center">
        {relays.length > 0 ? (
            relays.map((r) => (
                <div
                    class="h-3 w-3 rounded-full border border-solid border-gray-6 tooltip"
                    style={`background: ${hsl(stringToHue(r))}`} data-tip={r} />
              ))
        ) : (<span></span>)}
        </div>
    );
};

export default NoteRelaysList;
