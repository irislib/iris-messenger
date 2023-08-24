import React, { useMemo } from 'react';

import CreateNoteForm from '@/components/create/CreateNoteForm';
import FeedComponent from '@/components/feed/Feed';
import OnboardingNotification from '@/components/onboarding/OnboardingNotification';
import { getEventReplyingTo, isRepost } from '@/nostr/utils';
import { translate as t } from '@/translations/Translation.mjs';
import { RouteProps } from '@/views/types.ts';
import View from '@/views/View.tsx';

const Global: React.FC<RouteProps> = () => {
  const filterOptions = useMemo(
    () => [
      {
        name: t('posts'),
        filter: { kinds: [1, 6], limit: 10 },
        filterFn: (event) => !getEventReplyingTo(event) || isRepost(event),
        eventProps: { showRepliedMsg: true },
        mergeReposts: true,
      },
      {
        name: t('posts_and_replies'),
        filter: { kinds: [1, 6], limit: 5 },
        eventProps: { showRepliedMsg: true, fullWidth: false },
        mergeReposts: true,
      },
    ],
    [],
  );

  return (
    <View>
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <OnboardingNotification />
          <div className="hidden md:block px-4">
            <CreateNoteForm autofocus={false} placeholder={t('whats_on_your_mind')} />
          </div>
          <FeedComponent filterOptions={filterOptions} />
        </div>
      </div>
    </View>
  );
};

export default Global;
