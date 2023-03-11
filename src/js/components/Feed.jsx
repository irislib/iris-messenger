import { throttle } from 'lodash';
import isEqual from 'lodash/isEqual';
import styled from 'styled-components';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import PubSub from '../nostr/PubSub';
import SocialNetwork from '../nostr/SocialNetwork';
import { translate as t } from '../translations/Translation';

import Button from './buttons/Button';
import EventComponent from './events/EventComponent';
import ErrorBoundary from './ErrorBoundary';

const INITIAL_PAGE_SIZE = 20;

let isInitialLoad = true;
const listener = function () {
  isInitialLoad = false;
  window.removeEventListener('popstate', listener);
};
window.addEventListener('popstate', listener);

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 10px;
  @media (max-width: 625px) {
    grid-gap: 1px;
  }
`;

const DEFAULT_SETTINGS = {
  display: 'posts',
  realtime: false,
  replies: true,
  sortBy: 'created_at',
  sortDirection: 'desc',
};

class Feed extends Component {
  constructor() {
    super();
    let savedSettings = {};
    localState
      .get('settings')
      .get('feed')
      .once((s) => (savedSettings = s));
    this.state = {
      sortedMessages: [],
      queuedMessages: [],
      displayCount: INITIAL_PAGE_SIZE,
      messagesShownTime: Math.floor(Date.now() / 1000),
      settings: this.getSettings(savedSettings),
    };
    this.openedAt = Math.floor(Date.now() / 1000);
  }

  getSettings(override = {}) {
    // override default & saved settings with url params
    let settings = { ...DEFAULT_SETTINGS };
    if (['everyone', 'follows'].includes(this.props?.index)) {
      settings = Object.assign(settings, override);
    }
    for (const key in settings) {
      const value = Helpers.getUrlParameter(key);
      if (value !== null) {
        // if value is '1' or '0', convert to boolean
        if (value === '1' || value === '0') {
          settings[key] = value === '1';
        } else {
          settings[key] = value;
        }
      }
    }
    return settings;
  }

  saveSettings() {
    localState.get('settings').get('feed').put(this.state.settings);
  }

  updateSortedMessages = throttle(
    (sortedMessages) => {
      if (this.unmounted || !sortedMessages) {
        return;
      }
      const settings = this.state.settings;
      // iterate over sortedMessages and add newer than messagesShownTime to queue
      const queuedMessages = [];
      let hasMyMessage;
      if (settings.sortDirection === 'desc' && !settings.realtime) {
        for (let i = 0; i < sortedMessages.length; i++) {
          const id = sortedMessages[i];
          const message = Events.db.by('id', id);
          if (message && message.created_at > this.state.messagesShownTime) {
            if (message.pubkey === Key.getPubKey() && !Events.isRepost(message)) {
              hasMyMessage = true;
              break;
            }
            queuedMessages.push(id);
          }
        }
      }
      if (!hasMyMessage) {
        sortedMessages = sortedMessages.filter((id) => !queuedMessages.includes(id));
      }
      const messagesShownTime = hasMyMessage
        ? Math.floor(Date.now() / 1000)
        : this.state.messagesShownTime;
      this.setState({ sortedMessages, queuedMessages, messagesShownTime });
    },
    1000,
    { leading: true },
  );

  handleScroll = () => {
    // increase page size when scrolling down
    if (this.state.displayCount < this.state.sortedMessages.length) {
      if (
        this.props.scrollElement.scrollTop + this.props.scrollElement.clientHeight >=
        this.props.scrollElement.scrollHeight - 500
      ) {
        this.setState({ displayCount: this.state.displayCount + INITIAL_PAGE_SIZE });
      }
    }
    this.checkScrollPosition();
  };

  checkScrollPosition = () => {
    // if scrolled past this.base element's start, apply fixedTop class to it
    if (!this.props.scrollElement) {
      return;
    }
    const showNewMsgsFixedTop = this.props.scrollElement.scrollTop > this.base.offsetTop - 60;
    if (showNewMsgsFixedTop !== this.state.fixedTop) {
      this.setState({ showNewMsgsFixedTop });
    }
  };

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.props.scrollElement) {
      this.props.scrollElement.removeEventListener('scroll', this.handleScroll);
    }
    this.unsub && this.unsub();
  }

  addScrollHandler() {
    if (this.props.scrollElement) {
      this.props.scrollElement.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillMount() {
    if (!isInitialLoad && window.history.state?.state) {
      this.setState(window.history.state.state);
    }
  }

  componentDidMount() {
    this.addScrollHandler();
    this.subscribe();
    localState
      .get('settings')
      .get('feed')
      .on(
        this.sub((s) => {
          const settings = this.getSettings(s);
          this.setState({ settings });
        }),
      );
  }

  subscribe() {
    // TODO use LokiJS persistent dynamicviews so the result set is not recalculated all the time
    setTimeout(() => {
      this.unsub?.();
      let first = true;
      if (this.props.nostrUser) {
        if (this.props.index === 'postsAndReplies') {
          this.getPostsAndRepliesByUser(this.props.nostrUser, true);
        } else if (this.props.index === 'likes') {
          Events.getLikesByUser(this.props.nostrUser, (eventIds) => {
            this.updateSortedMessages(eventIds);
          });
        } else if (this.props.index === 'posts') {
          this.getPostsAndRepliesByUser(this.props.nostrUser, false);
        }
      } else {
        localState.get('scrollUp').on(
          this.sub(() => {
            !first && Helpers.animateScrollTop('.main-view');
            first = false;
          }),
        );
        if (this.props.keyword) {
          const keyword = this.props.keyword;
          Events.getMessagesByKeyword(this.props.keyword, (messages) => {
            if (this.props.keyword == keyword) this.updateSortedMessages(messages);
          });
        } else if (this.props.index) {
          // public messages
          if (this.props.index === 'everyone') {
            this.getMessagesByEveryone();
          } else if (this.props.index === 'notifications') {
            this.unsub = Events.getNotifications((messages) => this.updateSortedMessages(messages));
          } else if (this.props.index === 'follows') {
            this.getMessagesByFollows();
          }
        }
      }
    }, 0);
  }

  sort(a, b) {
    let aVal;
    let bVal;
    if (!a || !b) return 0;
    if (a && !b) return -1;
    if (!a && b) return 1;
    if (this.state.settings.sortBy === 'created_at') {
      aVal = a.created_at;
      bVal = b.created_at;
    } else if (this.state.settings.sortBy === 'likes') {
      aVal = Events.likesByMessageId.get(a.id)?.size || 0;
      bVal = Events.likesByMessageId.get(b.id)?.size || 0;
    } else if (this.state.settings.sortBy === 'zaps') {
      aVal = Events.zapsByNote.get(a.id)?.size || 0;
      bVal = Events.zapsByNote.get(b.id)?.size || 0;
    }
    if (this.state.settings.sortDirection === 'desc') {
      return bVal - aVal;
    } else {
      return aVal - bVal;
    }
  }

  getPostsAndRepliesByUser(pubkey, includeReplies) {
    this.unsub?.();
    // TODO apply filters
    const callback = () => {
      // throttle?
      const events = Events.db
        .chain()
        .find({ pubkey })
        .where((e) => {
          // TODO apply all filters from state.settings
          if (!includeReplies && e.tags.find((t) => t[0] === 'e')) {
            return false;
          }
          return true;
        })
        .data()
        .sort((a, b) => this.sort(a, b)) // why loki simplesort doesn't work?
        .map((e) => e.id);
      this.updateSortedMessages(events);
    };
    callback();
    this.unsub = PubSub.subscribe([{ kinds: [1, 3, 5, 7, 9735], limit: 100 }], callback, 'global');
  }

  getMessagesByEveryone() {
    this.unsub?.();
    // TODO apply filters
    const callback = throttle(() => {
      const events = Events.db
        .chain()
        .find({ kind: 1 })
        .where((e) => {
          // TODO apply all filters from state.settings
          if (!this.state.settings.replies && e.tags.find((t) => t[0] === 'e')) {
            return false;
          }
          return true;
        })
        .data()
        .sort((a, b) => this.sort(a, b)) // why loki simplesort doesn't work?
        .map((e) => e.id);
      this.updateSortedMessages(events);
    }, 1000);
    callback();
    this.unsub = PubSub.subscribe([{ kinds: [1, 3, 5, 7, 9735], limit: 100 }], callback, 'global');
  }

  getMessagesByFollows() {
    this.unsub?.();
    const callback = throttle(() => {
      // throttle?
      const events = Events.db
        .chain()
        .find({ kind: 1 })
        .where((e) => {
          // TODO apply all filters from state.settings
          if (!(SocialNetwork.followDistanceByUser.get(e.pubkey) <= 1)) {
            return false;
          }
          if (!this.state.settings.replies && e.tags.find((t) => t[0] === 'e')) {
            return false;
          }
          return true;
        })
        .data()
        .sort((a, b) => this.sort(a, b)) // why loki simplesort doesn't work?
        .map((e) => e.id);
      this.updateSortedMessages(events);
    }, 1000);

    callback();
    this.unsub = PubSub.subscribe([{ kinds: [1, 3, 5, 7, 9735] }], callback);
  }

  updateParams(prevState) {
    if (prevState.settings.display !== this.state.settings.display) {
      const url = new URL(window.location);
      if (this.state.settings.display === 'grid') {
        url.searchParams.set('display', 'grid');
      } else {
        url.searchParams.delete('display');
      }
      this.replaceState();
    }
    if (prevState.settings.replies !== this.state.settings.replies) {
      const url = new URL(window.location);
      if (this.state.settings.replies) {
        url.searchParams.set('replies', '1');
      } else {
        url.searchParams.delete('replies');
      }
      this.replaceState();
    }
    if (prevState.settings.realtime !== this.state.settings.realtime) {
      const url = new URL(window.location);
      if (this.state.settings.realtime) {
        url.searchParams.set('realtime', '1');
      } else {
        url.searchParams.delete('realtime');
      }
      this.replaceState();
    }
  }

  replaceState = throttle(
    () => {
      window.history.replaceState({ ...window.history.state, state: this.state }, '');
    },
    1000,
    { leading: true, trailing: true },
  );

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.scrollElement && this.props.scrollElement) {
      this.addScrollHandler();
    }
    if (prevState.settings.replies !== this.state.settings.replies) {
      this.subscribe();
    }
    if (prevState.settings.display !== this.state.settings.display) {
      this.setState({ displayCount: INITIAL_PAGE_SIZE });
    }
    if (!isEqual(prevState.settings, this.state.settings)) {
      this.updateParams(prevState);
      this.subscribe();
    }
    this.handleScroll();
    this.replaceState();
    if (!this.state.queuedMessages.length && prevState.queuedMessages.length) {
      Helpers.animateScrollTop('.main-view');
    }
    if (this.props.filter !== prevProps.filter || this.props.keyword !== prevProps.keyword) {
      this.setState({ sortedMessages: [] });
      this.componentDidMount();
    }
  }

  showQueuedMessages() {
    const sortedMessages = this.state.sortedMessages;
    console.log('sortedmessages.length', sortedMessages.length);
    sortedMessages.unshift(...this.state.queuedMessages);
    console.log('queuedmessages.length', this.state.queuedMessages.length);
    this.setState({
      sortedMessages,
      queuedMessages: [],
      messagesShownTime: Math.floor(Date.now() / 1000),
      displayCount: INITIAL_PAGE_SIZE,
    });
  }

  renderFeedTypeSelector() {
    const isProfile = ['posts', 'postsAndReplies', 'likes'].includes(this.props.index);
    return (
      <div className="tabs">
        <a
          style={isProfile ? { 'border-radius': '8px 0 0 0' } : {}}
          onClick={() => this.setState({ settings: { ...this.state.settings, display: 'posts' } })}
          className={this.state.settings.display === 'grid' ? '' : 'active'}
        >
          {Icons.post}
        </a>
        <a
          style={isProfile ? { 'border-radius': '0 8px 0 0' } : {}}
          className={this.state.settings.display === 'grid' ? 'active' : ''}
          onClick={() => this.setState({ settings: { ...this.state.settings, display: 'grid' } })}
        >
          {Icons.image}
        </a>
      </div>
    );
  }

  /*
  instead of renderFeedSelector() and renderFeedTypeSelector() let's do renderSettings()
  it contains all filters and display settings like state.settings.display, state.settings.realtime, state.settings.replies
   */
  renderSettings() {
    return (
      <div className="msg">
        <div className="msg-content">
          <div style="display:flex;flex-direction:column">
            <div style="flex-direction: column">
              <p>
                <span style="margin-right: 7px">{t('display')}:</span>
                <input
                  type="radio"
                  name="display"
                  value="posts"
                  id="display_posts"
                  checked={this.state.settings.display === 'posts'}
                  onChange={() =>
                    this.setState({ settings: { ...this.state.settings, display: 'posts' } })
                  }
                />
                <label htmlFor="display_posts">{t('posts')}</label>
                <input
                  type="radio"
                  name="display"
                  id="display_grid"
                  value="grid"
                  checked={this.state.settings.display === 'grid'}
                  onChange={() =>
                    this.setState({ settings: { ...this.state.settings, display: 'grid' } })
                  }
                />
                <label htmlFor="display_grid">{t('grid')}</label>
              </p>
              <p>
                <input
                  type="checkbox"
                  id="display_realtime"
                  checked={this.state.settings.realtime}
                  onChange={() =>
                    this.setState({
                      settings: { ...this.state.settings, realtime: !this.state.settings.realtime },
                    })
                  }
                />
                <label htmlFor="display_realtime">{t('realtime')}</label>
                <input
                  type="checkbox"
                  checked={this.state.settings.replies}
                  name="replies"
                  id="show_replies"
                  onChange={() =>
                    this.setState({
                      settings: { ...this.state.settings, replies: !this.state.settings.replies },
                    })
                  }
                />
                <label htmlFor="show_replies">{t('show_replies')}</label>
              </p>
              <p>
                Sort by
                <select
                  className="mar-left5"
                  value={this.state.settings.sortBy}
                  onChange={(e) =>
                    this.setState({ settings: { ...this.state.settings, sortBy: e.target.value } })
                  }
                >
                  <option value="created_at">{t('time')}</option>
                  <option value="likes">{t('likes')}</option>
                  <option value="zaps">{t('zaps')}</option>
                </select>
              </p>
              <p>
                Ordering
                <select
                  className="mar-left5"
                  value={this.state.settings.sortDirection}
                  onChange={(e) =>
                    this.setState({
                      settings: { ...this.state.settings, sortDirection: e.target.value },
                    })
                  }
                >
                  <option value="desc">{t('descending')}</option>
                  <option value="asc">{t('ascending')}</option>
                </select>
              </p>
              <p>
                <Button onClick={() => this.saveSettings()}>{t('save_as_defaults')}</Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderShowNewMessages() {
    return (
      <div
        className={`msg ${this.state.showNewMsgsFixedTop ? 'fixedTop' : ''}`}
        onClick={() => this.showQueuedMessages()}
      >
        <div className="msg-content notification-msg colored">
          {t('show_n_new_messages').replace('{n}', this.state.queuedMessages.length)}
        </div>
      </div>
    );
  }

  renderShowMore() {
    return (
      <p>
        <Button
          onClick={() =>
            this.setState({
              displayCount: this.state.displayCount + INITIAL_PAGE_SIZE,
            })
          }
        >
          {t('show_more')}
        </Button>
      </p>
    );
  }

  render() {
    if (!this.props.scrollElement || this.unmounted) {
      return;
    }
    const displayCount = this.state.displayCount;
    const showRepliedMsg = this.props.index !== 'likes' && !this.props.keyword;
    const feedName =
      !this.state.queuedMessages.length &&
      {
        everyone: 'global_feed',
        follows: 'following',
        notifications: 'notifications',
      }[this.props.index];

    const renderAs = this.state.settings.display === 'grid' ? 'NoteImage' : null;
    const messages = this.state.sortedMessages.slice(0, displayCount).map((id) => (
      <ErrorBoundary>
        <EventComponent
          notification={this.props.index === 'notifications'}
          key={id}
          id={id}
          showRepliedMsg={showRepliedMsg}
          renderAs={renderAs}
          feedOpenedAt={this.openedAt}
        />
      </ErrorBoundary>
    ));
    return (
      <div className="msg-feed">
        <div>
          {this.state.queuedMessages.length ? this.renderShowNewMessages() : null}
          {feedName ? (
            <div className="msg">
              <div className="msg-content notification-msg">
                <div style="display:flex;flex-direction: row;width:100%;align-items:center;text-align:center;">
                  <a href="/" style="padding-right: 10px;color:var(--text-color);">
                    {Icons.backArrow}
                  </a>
                  <div style="flex:1;">{t(feedName)}</div>
                  {['everyone', 'follows'].includes(this.props.index) && (
                    <a
                      style="padding: 0 10px;color:var(--text-color);"
                      onClick={() => this.setState({ settingsOpen: !this.state.settingsOpen })}
                    >
                      {Icons.settings}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {this.props.index !== 'notifications' && this.state.settingsOpen && this.renderSettings()}
          {this.props.index !== 'notifications' && this.renderFeedTypeSelector()}
          {renderAs === 'NoteImage' ? <ImageGrid>{messages}</ImageGrid> : messages}
        </div>
        {displayCount < this.state.sortedMessages.length ? this.renderShowMore() : ''}
      </div>
    );
  }
}

export default Feed;
