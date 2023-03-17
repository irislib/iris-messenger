import { route } from 'preact-router';

import Icons from '../Icons';
import localState from '../LocalState';

import View from './View';

class FeedList extends View {
  constructor() {
    super();
    this.class = 'public-messages-view';
    this.state = { feeds: {} };
  }

  componentDidMount() {
    this.restoreScrollPosition();
    localState.get('feeds').on(this.inject());
  }

  openFeed(feed) {
    localState.get('lastOpenedFeed').put(feed);
    route(`/feed/${feed}`);
  }

  renderView() {
    console.log('feeds', this.state.feeds);
    return (
      <div className="centered-container">
        {Object.entries(this.state.feeds).map((entry) => {
          const key = entry[0];
          const feed = entry[1];
          console.log('key feed', key, feed);
          if (!feed) {
            return null;
          }
          return (
            <div>
              <div style="margin-bottom: 5px" className="msg" onClick={() => this.openFeed(key)}>
                <div className="msg-content">
                  <div style="margin-right: 15px">
                    <div>{feed.icon && Icons[feed.icon]}</div>
                  </div>
                  <div className="msg-body" style="flex:1">
                    <h3 style="margin-top:0">{feed.name}</h3>
                    {feed.description}
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
