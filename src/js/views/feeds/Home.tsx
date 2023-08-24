import { useMemo } from 'react';

import CreateNoteForm from '@/components/create/CreateNoteForm';
import FeedComponent from '@/components/feed/Feed';
import Show from '@/components/helpers/Show';
import OnboardingNotification from '@/components/onboarding/OnboardingNotification';
import { useFollows } from '@/nostr/hooks/useFollows.ts';
import { getEventReplyingTo, isRepost } from '@/nostr/utils';
import { translate as t } from '@/translations/Translation.mjs';
import { RouteProps } from '@/views/types.ts';
import View from '@/views/View.tsx';

const Home: React.FC<RouteProps> = () => {
  const followedUsers = useFollows();

  const filterOptions = useMemo(
    () => [
      {
        name: t('posts'),
        filter: { kinds: [1, 6], authors: followedUsers, limit: 10 },
        filterFn: (event) => !getEventReplyingTo(event) || isRepost(event),
        mergeReposts: true,
        eventProps: { showRepliedMsg: true },
      },
      {
        name: t('posts_and_replies'),
        filter: { kinds: [1, 6], authors: followedUsers, limit: 5 },
        mergeReposts: true,
        eventProps: { showRepliedMsg: true, fullWidth: false },
      },
    ],
    [followedUsers],
  );

  return (
    <View>
      <div className="flex flex-col w-full">
        <OnboardingNotification />
        <div className="hidden md:block px-4">
          <CreateNoteForm autofocus={false} placeholder={t('whats_on_your_mind')} />
        </div>
        <Show when={followedUsers.length}>
          <FeedComponent key={`feed-${followedUsers.length}`} filterOptions={filterOptions} />
        </Show>
      </div>
    </View>
  );
};

export default Home;
