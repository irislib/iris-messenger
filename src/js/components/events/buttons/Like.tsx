import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'preact/hooks';

import Events from '../../../nostr/Events';
import Key from '../../../nostr/Key';

const Like = ({ event }) => {
  const [state, setState] = useState({
    likes: Events.likesByMessageId.get(event.id)?.size || 0,
    liked: false,
    likedBy: new Set<string>(),
  });

  useEffect(() => {
    return Events.getLikes(event.id, handleLikes);
  }, [event]);

  const handleLikes = (likedBy) => {
    const myPub = Key.getPubKey();
    setState((prevState) => ({
      ...prevState,
      likes: likedBy.size,
      liked: likedBy.has(myPub),
      likedBy,
    }));
  };

  const likeBtnClicked = (e) => {
    e.preventDefault();
    e.stopPropagation();
    like(!state.liked);
  };

  const like = (liked = true) => {
    if (liked) {
      const author = event.pubkey;
      const hexId = Key.toNostrHexAddress(event.id);
      if (hexId) {
        Events.publish({
          kind: 7,
          content: '+',
          tags: [
            ['e', hexId],
            ['p', author],
          ],
        });
      }
    }
  };

  return (
    <a
      className={`btn-ghost btn-sm justify-center hover:bg-transparent btn content-center gap-2 rounded-none ${
        state.liked ? 'text-iris-red' : 'hover:text-iris-red text-neutral-500'
      }`}
      onClick={(e) => likeBtnClicked(e)}
    >
      {state.liked ? <HeartIconFull width={18} /> : <HeartIcon width={18} />}
      {state.likes || ''}
    </a>
  );
};

export default Like;
