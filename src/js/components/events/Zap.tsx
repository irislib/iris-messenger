import { useEffect, useState } from 'react';
import { Event } from 'nostr-tools';
import { route } from 'preact-router';

import Icons from '../../Icons';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../user/Name';

import EventComponent from './EventComponent';

interface Props {
  event: Event;
}

const messageClicked = (e: MouseEvent, zappedId: string) => {
  const target = e.target as HTMLElement;
  if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => target.closest(tag))) {
    return;
  }
  if (window.getSelection()?.toString()) {
    return;
  }
  e.stopPropagation();
  route(`/${Key.toNostrBech32Address(zappedId, 'note')}`);
};

export default function Zap(props: Props) {
  const [allZaps, setAllZaps] = useState<string[]>([]);
  const zappedId = Events.getEventReplyingTo(props.event);
  const zappedEvent = Events.db.by('id', zappedId);
  const authorIsYou = zappedEvent?.pubkey === Key.getPubKey();
  const mentioned = zappedEvent?.tags?.find((tag) => tag[0] === 'p' && tag[1] === Key.getPubKey());
  const zappedText = authorIsYou
    ? 'zapped your note'
    : mentioned
    ? 'zapped a note where you were mentioned'
    : 'zapped a note';

  useEffect(() => {
    return zappedId
      ? Events.getZaps(zappedId, (zappedBy: any) => {
          setAllZaps(Array.from(zappedBy.values()));
        })
      : () => null;
  }, [zappedId]);

  let zappingUser = null as string | null;
  try {
    zappingUser = Events.getZappingUser(props.event.id);
  } catch (e) {
    console.error('no zapping user found for event', props.event.id, e);
    return '';
  }
  const userLink = `/${zappingUser}`;

  return (
    <div>
      <div onClick={(e) => messageClicked(e, zappedId || '')}>
        <div className="flex gap-1 items-center text-sm text-neutral-500 px-2 pt-2">
          <i className="zap-btn text-iris-orange">{Icons.lightning}</i>
          <div>
            <a href={userLink}>
              <Name pub={zappingUser || ''} />
            </a>
            {allZaps.length > 1 && <span> and {allZaps.length - 1} others </span>} {zappedText}
          </div>
        </div>
        <EventComponent key={zappedId + props.event.id} id={zappedId} fullWidth={false} />
      </div>
    </div>
  );
}
