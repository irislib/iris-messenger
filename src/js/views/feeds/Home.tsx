import { useEffect, useMemo, useState } from 'react';

import CreateNoteForm from '@/components/create/CreateNoteForm';
import FeedComponent from '@/components/feed/Feed';
import Show from '@/components/helpers/Show';
import OnboardingNotification from '@/components/onboarding/OnboardingNotification';
import Key from '@/nostr/Key';
import { getEventReplyingTo, isRepost } from '@/nostr/utils';
import { translate as t } from '@/translations/Translation.mjs';
import { ID, STR } from '@/utils/UniqueIds';
import { RouteProps } from '@/views/types.ts';
import View from '@/views/View.tsx';

import SocialNetwork from '../../nostr/SocialNetwork';

const Home: React.FC<RouteProps> = () => {
  const [followedUsers, setFollowedUsers] = useState(() => {
    const initialFollowedUsers = SocialNetwork.followedByUser.get(ID(Key.getPubKey())) || new Set();
    initialFollowedUsers.add(ID(Key.getPubKey()));
    return Array.from(initialFollowedUsers).map((n) => STR(n));
  });

  useEffect(() => {
    const unsub = SocialNetwork.getFollowedByUser(
      Key.getPubKey(),
      (newFollowedUsers) => {
        setFollowedUsers(Array.from(newFollowedUsers));
      },
      true,
    );

    return () => {
      unsub?.();
    };
  }, []);

  const filterOptions = useMemo(
    () => [
      {
        name: t('posts'),
        filter: { kinds: [1, 6], authors: followedUsers, limit: 10 },
        filterFn: (event) => !getEventReplyingTo(event) || isRepost(event),
        eventProps: { showRepliedMsg: true },
      },
      {
        name: t('posts_and_replies'),
        filter: { kinds: [1, 6], authors: followedUsers, limit: 5 },
        eventProps: { showRepliedMsg: true, fullWidth: false },
      },
    ],
    [followedUsers],
  );

  console.log('followedUsers.length', followedUsers.length); // TODO this keeps changing, fix

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
