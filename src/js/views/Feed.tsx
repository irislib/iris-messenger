import FeedComponent from '../components/feed/Feed';
import OnboardingNotification from '../components/OnboardingNotification';
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
      <>
        {this.props.keyword ? (
          <h2>
            {t('search')}: "{this.props.keyword}"
          </h2>
        ) : (
          <OnboardingNotification />
        )}
        <FeedComponent
          scrollElement={this.scrollElement.current}
          keyword={this.props.keyword}
          key={this.props.index || 'feed'}
          index={this.props.index}
          path={path}
        />
      </>
    );
  }
}

export default Feed;
