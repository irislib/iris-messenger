import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import $ from 'jquery';
import { memo } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';

import Events from '../../../nostr/Events';
import Key from '../../../nostr/Key';
import ReactionsList from '../ReactionsList';

import Like from './Like';
import Repost from './Repost';
import Zap from './Zap';

const ReactionButtons = (props) => {
  const [state, setState] = useState({
    replyCount: 0,
  });

  const event = props.event;

  useEffect(() => {
    return Events.getThreadRepliesCount(event.id, handleThreadReplyCount);
  }, [event]);

  const handleThreadReplyCount = (threadReplyCount) => {
    setState((prevState) => ({
      ...prevState,
      replyCount: threadReplyCount,
    }));
  };

  function replyBtnClicked() {
    if (props.standalone) {
      $(document).find('textarea').focus();
    } else {
      route(`/${Key.toNostrBech32Address(props.event.id, 'note')}`);
    }
  }

  return (
    <>
      {props.standalone && <ReactionsList event={props.event} />}
      <div className="flex gap-4">
        <a
          className="btn-ghost btn-sm hover:bg-transparent hover:text-iris-blue btn content-center gap-2 rounded-none text-neutral-500"
          onClick={() => replyBtnClicked()}
        >
          <ChatBubbleOvalLeftIcon width={18} />
          <span>{state.replyCount || ''}</span>
        </a>
        <Repost event={props.event} />
        <Like event={props.event} />
        <Zap event={props.event} />
      </div>
    </>
  );
};

export default memo(ReactionButtons);
