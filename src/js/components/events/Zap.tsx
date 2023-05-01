import { useEffect, useState } from 'react';
import { route } from 'preact-router';

import Icons from '../../Icons';
import { Event } from '../../lib/nostr-tools';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../Name';

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
    const unsub = Events.getRepliesAndReactions(
      zappedId,
      (_a: Set<string>, _b: Set<string>, _c: number, _d: Set<string>, zappedBy: Set<string>) => {
        setAllZaps(Array.from(zappedBy.values()));
      },
    );
    return () => unsub();
  }, [zappedId]);

  let zappingUser = null;
  try {
    zappingUser = Events.getZappingUser(props.event.id);
  } catch (e) {
    console.error('no zapping user found for event', props.event.id, e);
    return '';
  }
  const userLink = `/${zappingUser}`;
  return (
    <div className="msg">
      <div className="msg-content" onClick={(e) => messageClicked(e, zappedId)}>
        <div style={{ display: 'flex', flex: 1, 'flex-direction': 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <i className="zap-btn zapped" style={{ marginRight: '15px' }}>
              {Icons.lightning}
            </i>
            <div>
              <a href={userLink} style={{ marginRight: '5px' }}>
                <Name pub={zappingUser} />
              </a>
              {allZaps.length > 1 && <span> and {allZaps.length - 1} others </span>}
              {zappedText}
            </div>
          </div>
          <EventComponent key={zappedId + props.event.id} id={zappedId} fullWidth={false} />
        </div>
      </div>
    </div>
  );
}
