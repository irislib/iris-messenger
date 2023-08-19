import { useEffect, useState } from 'react';
import { HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { Event } from 'nostr-tools';
import { route } from 'preact-router';

import EventDB from '@/nostr/EventDB';
import { getEventReplyingTo } from '@/nostr/utils';

import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import Name from '../user/Name';

import EventComponent from './EventComponent';

type Props = {
  event: Event;
};

const messageClicked = (e: MouseEvent, likedId: string) => {
  const target = e.target as HTMLElement;
  if (['A', 'BUTTON', 'TEXTAREA', 'IMG', 'INPUT'].find((tag) => target.closest(tag))) {
    return;
  }
  if (window.getSelection()?.toString()) {
    return;
  }
  e.stopPropagation();
  route(`/${Key.toNostrBech32Address(likedId, 'note')}`);
};

export default function Like(props: Props) {
  const [allLikes, setAllLikes] = useState<string[]>([]);
  const likedId = getEventReplyingTo(props.event);
  const likedEvent = EventDB.get(likedId);
  const authorIsYou = likedEvent?.pubkey === Key.getPubKey();
  const mentioned = likedEvent?.tags?.find((tag) => tag[0] === 'p' && tag[1] === Key.getPubKey());
  const likeText = authorIsYou
    ? 'liked your note'
    : mentioned
    ? 'liked a note where you were mentioned'
    : 'liked a note';

  useEffect(() => {
    if (likedId) {
      return Events.getLikes(likedId, (likedBy: Set<string>) => {
        setAllLikes(Array.from(likedBy));
      });
    }
  }, [likedId]);

  if (!likedId) {
    return null;
  }

  const userLink = `/${Key.toNostrBech32Address(props.event.pubkey, 'npub')}`;
  return (
    <div key={props.event.id}>
      <div onClick={(e) => messageClicked(e, likedId)}>
        <div className="flex gap-1 items-center text-sm text-neutral-500 px-2 pt-2">
          <i className="like-btn text-iris-red">
            <HeartIconFull width={18} />
          </i>
          <span>
            <a href={userLink}>
              <Name pub={props.event.pubkey} />
            </a>
            {allLikes.length > 1 && <> and {allLikes.length - 1} others </>} {likeText}
          </span>
        </div>
        <EventComponent key={likedId + props.event.id} id={likedId} fullWidth={false} />
      </div>
    </div>
  );
}
