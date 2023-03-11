import { route } from 'preact-router';

import Icons from '../Icons';
import localState from '../LocalState';
import { translate as t } from '../translations/Translation';

import View from './View';

class FeedList extends View {
  constructor() {
    super();
    this.class = 'public-messages-view';
    this.state = {
      feeds: {
        following: {
          name: 'Following',
          description: 'Public messages from people you follow',
          icon: Icons.newFollower,
        },
        global: {
          name: 'Global',
          description: 'Public messages from everyone in your social network',
          icon: Icons.global,
        },
      },
    };
  }

  componentDidMount() {
    this.restoreScrollPosition();
  }

  openFeed(feed) {
    localState.get('lastOpenedFeed').put(feed);
    route(`/${feed}`);
  }

  renderView() {
    return (
      <div className="centered-container">
        {Object.keys(this.state.feeds).map((key) => {
          const feed = this.state.feeds[key];
          return (
            <div>
              <div style="margin-bottom: 5px" className="msg" onClick={() => this.openFeed(key)}>
                <div className="msg-content">
                  <div style="margin-right: 15px">
                    <div>{feed.icon}</div>
                  </div>
                  <div className="msg-body">
                    <h3 style="margin-top:0">{t(feed.name)}</h3>
                    {t(feed.description)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default FeedList;
