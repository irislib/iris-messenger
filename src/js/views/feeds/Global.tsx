import CreateNoteForm from '@/components/create/CreateNoteForm';
import FeedComponent from '@/components/feed/Feed';
import OnboardingNotification from '@/components/onboarding/OnboardingNotification';
import { getEventReplyingTo } from '@/nostr/utils';
import { translate as t } from '@/translations/Translation.mjs';

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
            <CreateNoteForm autofocus={false} placeholder={t('whats_on_your_mind')} />
          </div>
          <FeedComponent
            filterOptions={[
              {
                name: t('posts'),
                filter: { kinds: [1, 6], limit: 10 },
                filterFn: (event) => !getEventReplyingTo(event),
                eventProps: { showRepliedMsg: true },
              },
              {
                name: t('posts_and_replies'),
                filter: { kinds: [1, 6], limit: 5 },
                eventProps: { showRepliedMsg: true, fullWidth: false },
              },
            ]}
          />
        </div>
      </div>
    );
  }
}

export default Feed;
