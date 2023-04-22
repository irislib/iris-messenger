import FeedComponent from '../components/feed/Feed';
import OnboardingNotification from '../components/OnboardingNotification';
import localState from '../LocalState';
import { translate as t } from '../translations/Translation';

import View from './View';

class Feed extends View {
  constructor() {
    super();
    this.eventListeners = {};
    this.state = { sortedMessages: [], group: 'follows' };
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
    localState.get('filters').get('group').on(this.inject());
  }

  renderView() {
    const path = this.props.index || 'msgs';
    return (
      <div class="centered-container">
        <div style="display:flex;flex-direction:row">
          <div style="flex:3;width: 100%">
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
          </div>
        </div>
      </div>
    );
  }
}

export default Feed;
