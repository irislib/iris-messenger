import FeedComponent from '../components/feed/Feed';
import OnboardingNotification from '../components/OnboardingNotification';
import PublicMessageForm from '../components/PublicMessageForm';
import { translate as t } from '../translations/Translation.mjs';

import Search from './Search';
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
        <div className="flex flex-col w-full lg:w-2/3">
          {this.props.keyword ? (
            <h2 className="text-2xl mb-2">
              {t('search')}: "{this.props.keyword}"
            </h2>
          ) : (
            <>
              <OnboardingNotification />
              <PublicMessageForm placeholder={t('whats_on_your_mind')} />
            </>
          )}
          <FeedComponent
            keyword={this.props.keyword}
            key={this.props.index || 'feed'}
            index={this.props.index}
            path={path}
          />
        </div>
        <div className="sticky flex-col hidden lg:flex lg:w-1/3">
          <Search />
        </div>
      </div>
    );
  }
}

export default Feed;
