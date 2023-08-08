import FeedComponent from '@/components/feed/Feed';
import OnboardingNotification from '@/components/OnboardingNotification';
import PublicMessageForm from '@/components/PublicMessageForm';
import { translate as t } from '@/translations/Translation.mjs';

import SocialNetwork from '../../nostr/SocialNetwork';
import View from '../View';

class Feed extends View {
  constructor() {
    super();
    this.state = { sortedMessages: [] };
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
  }

  renderView() {
    return (
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <OnboardingNotification />
          <div className="hidden md:block px-4">
            <PublicMessageForm autofocus={false} placeholder={t('whats_on_your_mind')} />
          </div>
          <FeedComponent
            filterOptions={[
              {
                name: 'Followed users',
                filter: { kinds: [1] },
                filterFn: (event) => SocialNetwork.getFollowDistance(event.pubkey) <= 1,
              },
            ]}
          />
        </div>
      </div>
    );
  }
}

export default Feed;
