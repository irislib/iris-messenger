import FeedComponent from '../components/feed/Feed';
import Show from '../components/helpers/Show';
import OnboardingNotification from '../components/OnboardingNotification';
import PublicMessageForm from '../components/PublicMessageForm';
import { translate as t } from '../translations/Translation.mjs';

import View from './View';

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
    const path = this.props.index || 'msgs';
    return (
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <Show when={!this.props.keyword}>
            <OnboardingNotification />
            <div className="hidden md:block px-4">
              <PublicMessageForm autofocus={false} placeholder={t('whats_on_your_mind')} />
            </div>
          </Show>
          <FeedComponent
            keyword={this.props.keyword}
            key={this.props.index || 'feed'}
            index={this.props.index}
            path={path}
          />
        </div>
      </div>
    );
  }
}

export default Feed;
