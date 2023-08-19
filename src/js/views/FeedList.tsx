import { route } from 'preact-router';

import { translate as t } from '../translations/Translation.mjs';
import Icons from '../utils/Icons';

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
    route(`/${feed}`);
  }

  renderView() {
    return (
      <div className="centered-container flex flex-wrap justify-center">
        {Object.keys(this.state.feeds).map((key) => {
          const feed = this.state.feeds[key];
          return (
            <div
              className="card bordered w-full cursor-pointer bg-neutral-900 m-2"
              onClick={() => this.openFeed(key)}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="w-8 mr-4">{feed.icon}</div>
                  <div>
                    <h2 className="card-title">{t(feed.name)}</h2>
                    <p>{t(feed.description)}</p>
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
