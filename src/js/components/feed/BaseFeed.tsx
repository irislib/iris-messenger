import React from 'react';
import { throttle } from 'lodash';
import isEqual from 'lodash/isEqual';

import BaseComponent from '../../BaseComponent';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub, { Unsubscribe } from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import { translate as t } from '../../translations/Translation';
import { PrimaryButton as Button } from '../buttons/Button';
import ErrorBoundary from '../ErrorBoundary';
import EventComponent from '../events/EventComponent';

import FeedSettings from './FeedSettings';
import FeedTypeSelector from './FeedTypeSelector';
import ImageGrid from './ImageGrid';
import Label from './Label';
import SortedEventMap from './SortedEventMap';
import { FeedProps, FeedState } from './types';

const INITIAL_PAGE_SIZE = 10;

let isInitialLoad = true;
const listener = function () {
  isInitialLoad = false;
  window.removeEventListener('popstate', listener);
};
window.addEventListener('popstate', listener);

const DEFAULT_SETTINGS = {
  display: 'posts',
  realtime: false,
  showReplies: true,
  sortBy: 'created_at',
  sortDirection: 'desc',
  timespan: 'all',
};

class Feed extends BaseComponent<FeedProps, FeedState> {
  openedAt: number;
  subscribeRetryTimeout: ReturnType<typeof setTimeout> | undefined;
  unsub: (() => void) | undefined;

  constructor(props: FeedProps) {
    super(props);
    let savedSettings = { display: undefined };
    localState
      .get('settings')
      .get('feed')
      .once((s) => (savedSettings = s));
    this.state = {
      sortedEvents: [],
      queuedEvents: [],
      displayCount: INITIAL_PAGE_SIZE,
      eventsShownTime: Math.floor(Date.now() / 1000),
      settings: this.getSettings(savedSettings),
    };
    this.openedAt = Math.floor(Date.now() / 1000);
  }

  getSettings(override = { display: undefined }) {
    // override default & saved settings with url params
    let settings = { ...DEFAULT_SETTINGS };
    if (['global', 'follows'].includes(this.props?.index)) {
      settings = Object.assign(settings, override);
    }
    if (this.props?.index !== 'notifications' && override.display) {
      settings.display = override.display;
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

  updateSortedEvents = (sortedEvents) => {
    if (this.unmounted || !sortedEvents) {
      return;
    }
    const settings = this.state.settings;
    // iterate over sortedEvents and add newer than eventsShownTime to queue
    const queuedEvents = [];
    let hasMyEvent;
    if (settings.sortDirection === 'desc' && !settings.realtime) {
      for (let i = 0; i < sortedEvents.length; i++) {
        const id = sortedEvents[i];
        const event = Events.db.by('id', id);
        if (event && event.created_at > this.state.eventsShownTime) {
          if (event.pubkey === Key.getPubKey() && !Events.isRepost(event)) {
            hasMyEvent = true;
            break;
          }
          queuedEvents.push(id);
        }
      }
    }
    if (!hasMyEvent) {
      sortedEvents = sortedEvents.filter((id) => !queuedEvents.includes(id));
    }
    const eventsShownTime = hasMyEvent ? Math.floor(Date.now() / 1000) : this.state.eventsShownTime;
    this.setState({ sortedEvents, queuedEvents, eventsShownTime });
  };

  handleScroll = () => {
    // increase page size when scrolling down
    if (this.state.displayCount < this.state.sortedEvents.length) {
      if (
        this.props.scrollElement.scrollTop + this.props.scrollElement.clientHeight >=
        this.props.scrollElement.scrollHeight - 1000
      ) {
        // TODO load more events
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
    const showNewMsgsFixedTop =
      this.props.scrollElement.scrollTop > (this.base as HTMLElement).offsetTop - 60;
    if (showNewMsgsFixedTop !== this.state.showNewMsgsFixedTop) {
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
    if (isEqual(this.state.settings, DEFAULT_SETTINGS)) {
      // no settings saved in history state, load from localstorage
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
    let first = true;
    localState.get('scrollUp').on(
      this.sub(() => {
        !first && Helpers.animateScrollTop('.main-view');
        first = false;
      }),
    );
  }

  subscribe() {
    this.unsub?.();
    clearTimeout(this.subscribeRetryTimeout);
    const results = new SortedEventMap(
      this.state.settings.sortBy,
      this.state.settings.sortDirection,
    );
    const update = () => {
      this.updateSortedEvents(
        results
          .events()
          .filter((event) => {
            if (SocialNetwork.blockedUsers.has(event.pubkey)) {
              return false;
            }
            const repliedMsg = Events.getEventReplyingTo(event);
            if (repliedMsg) {
              if (!this.state.settings.showReplies) {
                return false;
              }
              const author = Events.db.by('id', repliedMsg)?.pubkey;
              if (author && SocialNetwork.blockedUsers.has(author)) {
                return false;
              }
            }
            return true;
          })
          .map((event) => event.id),
      );
    };
    const throttledUpdate = throttle(update, 1000);
    let updated = false;
    const callback = (event) => {
      if (results.has(event.id)) {
        return;
      }
      results.add(event);
      if (results.size > 50 && !updated) {
        // TODO should filter results, only count what's shown
        updated = true;
        update();
      } else {
        throttledUpdate();
      }
    };
    const go = () => {
      this.unsub?.();
      if (this.props.index === 'notifications') {
        this.unsub = Events.notifications.subscribe((eventIds) => {
          eventIds.forEach((id) => callback(Events.db.by('id', id)));
        });
      } else {
        this.unsub = this.getEvents(callback);
        const followCount = SocialNetwork.followedByUser.get(Key.getPubKey())?.size;
        const unsub = PubSub.subscribe({ authors: [Key.getPubKey()], kinds: [3] }, () => {
          // is this needed?
          if (followCount !== SocialNetwork.followedByUser.get(Key.getPubKey())?.size) {
            unsub();
            this.subscribe();
          }
        });
      }
    };
    go();
    if (results.size === 0) {
      this.subscribeRetryTimeout = setTimeout(go, 1000);
    }
  }

  getEvents(callback): Unsubscribe {
    return () => {
      // override this
    };
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
    if (!isEqual(prevState.settings, this.state.settings)) {
      this.setState({ displayCount: INITIAL_PAGE_SIZE });
      this.subscribe();
    }
    this.handleScroll();
    this.replaceState();
    if (!this.state.queuedEvents.length && prevState.queuedEvents.length) {
      Helpers.animateScrollTop('.main-view');
    }
    if (this.props.filter !== prevProps.filter || this.props.keyword !== prevProps.keyword) {
      this.setState({ sortedEvents: [] });
      this.componentDidMount();
    }
  }

  showQueuedEvents() {
    const sortedEvents = this.state.sortedEvents;
    console.log('sortedEvents.length', sortedEvents.length);
    sortedEvents.unshift(...this.state.queuedEvents);
    console.log('queuedEvents.length', this.state.queuedEvents.length);
    this.setState({
      sortedEvents,
      queuedEvents: [],
      eventsShownTime: Math.floor(Date.now() / 1000),
      displayCount: INITIAL_PAGE_SIZE,
    });
  }

  renderShowNewEvents() {
    return (
      <div
        className={`msg ${this.state.showNewMsgsFixedTop ? 'fixedTop' : ''}`}
        onClick={() => this.showQueuedEvents()}
      >
        <div className="msg-content notification-msg colored">
          <div style="height: 27.5px; line-height: 27.5px">
            {t('show_n_new_messages').replace('{n}', this.state.queuedEvents.length)}
          </div>
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

  renderEvents(displayCount, renderAs, showRepliedMsg) {
    return this.state.sortedEvents.slice(0, displayCount).map((id) => (
      <ErrorBoundary>
        <EventComponent
          key={id}
          id={id}
          showRepliedMsg={showRepliedMsg}
          renderAs={renderAs}
          feedOpenedAt={this.openedAt}
          showReplies={0}
        />
      </ErrorBoundary>
    ));
  }

  render() {
    if (!this.props.scrollElement || this.unmounted) {
      return;
    }
    const displayCount = this.state.displayCount;
    const showRepliedMsg = this.props.index !== 'likes' && !this.props.keyword;
    const feedName =
      !this.state.queuedEvents.length &&
      {
        global: 'global_feed',
        follows: 'following',
        notifications: 'notifications',
      }[this.props.index];

    const renderAs = this.state.settings.display === 'grid' ? 'NoteImage' : null;
    const events = this.renderEvents(displayCount, renderAs, showRepliedMsg);
    return (
      <div className="msg-feed">
        <div>
          {this.state.queuedEvents.length ? this.renderShowNewEvents() : null}
          {feedName ? (
            <Label
              feedName={feedName}
              onClick={() => this.setState({ settingsOpen: !this.state.settingsOpen })}
              index={this.props.index}
            />
          ) : null}
          {this.props.index !== 'notifications' && this.state.settingsOpen && (
            <FeedSettings
              settings={this.state.settings}
              onChange={(settings) => this.setState({ settings })}
            />
          )}
          {this.props.index !== 'notifications' && (
            <FeedTypeSelector
              index={this.props.index}
              display={this.state.settings.display}
              setDisplay={(display) =>
                this.setState({ settings: { ...this.state.settings, display } })
              }
            />
          )}
          {events.length === 0 && (
            <div className="msg">
              <div className="msg-content notification-msg">
                {this.props.emptyMessage || t('no_events_yet')}
              </div>
            </div>
          )}
          {renderAs === 'NoteImage' ? <ImageGrid>{events}</ImageGrid> : events}
        </div>
        {displayCount < this.state.sortedEvents.length ? this.renderShowMore() : ''}
      </div>
    );
  }
}

export default Feed;
