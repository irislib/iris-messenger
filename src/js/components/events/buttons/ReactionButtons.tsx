import { memo } from 'preact/compat';

import Show from '@/components/helpers/Show';
import localState from '@/state/LocalState.ts';

import ReactionsList from '../ReactionsList';

import Like from './Like';
import Repost from './Repost';
import Zap from './Zap';
import Reply from './Reply'; // Add this import

let settings: any = {};
localState.get('settings').on((s) => (settings = s));

const ReactionButtons = ({ event, standalone }) => {
  return (
    <>
      {standalone && <ReactionsList event={event} />}
      <div className="flex gap-4">
        <Reply event={event} standalone={standalone} />
        <Show when={settings.showReposts !== false}>
          <Repost event={event} />
        </Show>
        <Show when={settings.showLikes !== false}>
          <Like event={event} />
        </Show>
        <Show when={settings.showZaps !== false}>
          <Zap event={event} />
        </Show>
      </div>
    </>
  );
};

export default memo(ReactionButtons);
