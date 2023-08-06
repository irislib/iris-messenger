import { debounce } from 'lodash';
import isEqual from 'lodash/isEqual';

import BaseComponent from '../../BaseComponent';
import Helpers from '../../Helpers';
import localState from '../../LocalState';
import Events from '../../nostr/Events';
import Key from '../../nostr/Key';
import PubSub, { Unsubscribe } from '../../nostr/PubSub';
import SocialNetwork from '../../nostr/SocialNetwork';
import { ID } from '../../nostr/UserIds';
import { translate as t } from '../../translations/Translation.mjs';
import SortedEventMap from '../../utils/SortedEventMap';
import Show from '../helpers/Show';

import EventList from './EventList';
import FeedSettings from './FeedSettings';
import FeedTypeSelector from './FeedTypeSelector';
import ShowMore from './ShowMore';
import ShowNewEvents from './ShowNewEvents';
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
  showReplies: false,
  sortBy: 'created_at',
  sortDirection: 'desc',
  timespan: 'all',
};

class Feed extends BaseComponent<FeedProps, FeedState> {
  openedAt: number;
  subscribeRetryTimeout: ReturnType<typeof setTimeout> | undefined;
  unsub: (() => void) | undefined;
  unsubLoadMore: (() => void) | undefined;
  twoSecondsPassed: boolean;
  sortedEventMap: SortedEventMap;

  constructor(props: FeedProps) {
    super(props);
    let savedSettings = {};
    localState
      .get('settings')
      .get('feed')
      .once((s) => (savedSettings = s));
    this.state = {
      events: [],
      queuedEvents: [],
      displayCount: INITIAL_PAGE_SIZE,
      settings: this.getSettings(savedSettings),
    };
    this.openedAt = Math.floor(Date.now() / 1000);
    this.twoSecondsPassed = false;
    this.sortedEventMap = new SortedEventMap(
      this.state.settings.sortBy,
      this.state.settings.sortDirection,
    );
  }

  getSettings(override = {} as any) {
    // override default & saved settings with url params
    let settings = { ...DEFAULT_SETTINGS };
    if (['global', 'follows'].includes(this.props?.index || '')) {
      settings = Object.assign(settings, override);
    }
    if (this.props?.index !== 'notifications' && override.display) {
      settings.display = override.display;
    }
    if (this.props?.index === 'posts') {
      settings.showReplies = false;
    }
    if (['postsAndReplies', 'notifications', 'likes'].includes(this.props?.index || '')) {
      settings.showReplies = true;
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
    if (this.props.keyword) {
      settings.showReplies = true;
    }
    return settings;
  }

  handleScroll = () => {
    // increase page size when scrolling down
    if (this.state.displayCount < this.state.events.length) {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        this.setState({
          displayCount: this.state.displayCount + INITIAL_PAGE_SIZE, // TODO FIX!
        });
        console.log('show more events', this.state.displayCount);
      }
    } else if (!this.unsubLoadMore) {
      // not sure if this is working, don't know how relaypool handles since & until
      console.log('loadMore');

      const unsub = () => {
        this.unsubLoadMore?.();
        this.unsubLoadMore = undefined;
      };

      let timeoutId = setTimeout(unsub, 2000);

      this.unsubLoadMore = this.getEvents((event) => {
        // getEvents should take into account that we already have some events
        console.log('got More');
        this.handleEvent(event);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(unsub, 2000);
      });
    }
  };

  handleScrollKeys = (e) => {
    const name = e.key;
    if (name === 'j')
      window.scrollBy({
        top: document.documentElement.clientHeight / 2,
        left: 0,
        behavior: 'smooth',
      });
    if (name === 'k')
      window.scrollBy({
        top: -document.documentElement.clientHeight / 2,
        left: 0,
        behavior: 'smooth',
      });
  };

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keyup', this.handleScrollKeys);
    this.unsub && this.unsub();
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('keyup', this.handleScrollKeys);
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
  }

  componentWillMount() {
    if (!isInitialLoad && window.history.state?.state) {
      this.setState(window.history.state.state);
    }
  }

  subscribe() {
    this.unsub?.();
    this.unsubLoadMore?.();
    clearTimeout(this.subscribeRetryTimeout);

    this.startTwoSecondsTimer();

    this.subscribeWithRetry((event) => this.handleEvent(event));
  }

  subscribeWithRetry(callback) {
    const go = () => {
      this.unsub?.();
      this.unsubLoadMore?.();

      if (this.props.index === 'notifications') {
        this.unsub = Events.notifications.subscribe((eventIds) => {
          eventIds.forEach((id) => callback(Events.db.by('id', id)));
        });
      } else {
        this.subscribeToEvents(callback);
      }
    };
    go();

    if (this.sortedEventMap.size === 0) {
      this.subscribeRetryTimeout = setTimeout(go, 1000);
    }
  }

  startTwoSecondsTimer() {
    this.twoSecondsPassed = false;
    setTimeout(() => {
      this.twoSecondsPassed = true;
    }, 2000);
  }

  update() {
    const eventIds = this.state.events;
    const oldestShownEventId = eventIds[Math.min(this.state.displayCount - 1, eventIds.length - 1)];
    const oldestShownEvent = Events.db.by('id', oldestShownEventId);

    const queuedEvents = [] as string[];

    this.sortedEventMap.events().forEach((event) => {
      if (event.created_at < oldestShownEvent?.created_at) {
        queuedEvents.push(event.id);
      }
    });

    this.updateState(queuedEvents);
  }

  updateState(queuedEvents) {
    if (this.twoSecondsPassed && !this.state.settings.realtime && this.state.events.length > 5) {
      this.setState({ queuedEvents: [...this.state.queuedEvents, ...queuedEvents] });
    } else {
      this.setState({
        events: this.sortedEventMap.eventIds,
        queuedEvents: [],
      });
    }
  }

  handleEvent(event) {
    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    this.sortedEventMap.add(event);

    this.update();
  }

  shouldIgnoreEvent(event) {
    if (this.sortedEventMap.has(event.id)) {
      return true;
    }

    if (SocialNetwork.isBlocked(event.pubkey)) {
      return true;
    }

    const repliedMsg = Events.getEventReplyingTo(event);

    // maybe other filters like hasImages here

    if (repliedMsg) {
      if (!this.state.settings.showReplies) {
        return true;
      }

      const author = Events.db.by('id', repliedMsg)?.pubkey;
      if (author && SocialNetwork.isBlocked(author)) {
        return true;
      }
    }

    return false;
  }

  subscribeToEvents(callback) {
    this.unsub = this.getEvents(callback);
    const myId = ID(Key.getPubKey());
    const followCount = SocialNetwork.followedByUser.get(myId)?.size;

    const unsub = PubSub.subscribe({ authors: [Key.getPubKey()], kinds: [3] }, () => {
      // is this needed?
      if (followCount !== SocialNetwork.followedByUser.get(myId)?.size) {
        unsub();
        this.subscribe();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getEvents(_callback): Unsubscribe {
    return () => {
      // override this
    };
  }

  replaceState = debounce(
    () => {
      window.history.replaceState({ ...window.history.state, state: this.state }, '');
    },
    1000,
    { leading: true, trailing: true },
  );

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.settings?.showReplies !== this.state.settings?.showReplies ||
      prevState.settings?.display !== this.state.settings?.display
    ) {
      this.subscribe();
    }
    this.handleScroll();
    this.replaceState();
    if (this.props.filter !== prevProps.filter || this.props.keyword !== prevProps.keyword) {
      this.sortedEventMap = new SortedEventMap(
        this.state.settings.sortBy,
        this.state.settings.sortDirection,
      );
      this.setState({ events: [] });
      this.componentDidMount();
    }
  }

  oldestEventCreatedAt() {
    return this.sortedEventMap.last()?.created_at;
  }

  showQueuedEvents() {
    this.setState({
      events: this.sortedEventMap.eventIds,
      queuedEvents: [],
      displayCount: INITIAL_PAGE_SIZE,
    });
    window.scrollTo(0, 0);
    // TODO scroll up only if queued events are newer than newest shown
  }

  render() {
    if (this.unmounted) {
      return;
    }

    const { displayCount, settings, queuedEvents, settingsOpen } = this.state;
    const { index, keyword } = this.props;
    const showRepliedMsg = index !== 'likes' && !keyword;
    const showQueuedEvents = queuedEvents.length > 0 && !settingsOpen;
    const renderAs = settings.display === 'grid' ? 'NoteImage' : null;

    const events = (
      <EventList
        events={this.state.events}
        displayCount={displayCount}
        renderAs={renderAs}
        showRepliedMsg={showRepliedMsg}
        openedAt={this.openedAt}
        settings={settings}
      />
    );

    return (
      <div className="mb-4">
        <Show when={showQueuedEvents}>
          <ShowNewEvents onClick={() => this.showQueuedEvents()} />
        </Show>
        <Show when={index !== 'notifications' && this.state.settingsOpen}>
          <FeedSettings
            settings={settings}
            onChange={(settings) => this.setState({ displayCount: INITIAL_PAGE_SIZE, settings })}
          />
        </Show>
        <Show when={['global', 'follows'].includes(index || '')}>
          <div className="flex items-center mx-4 my-4">
            <div
              className={`btn btn-sm  mr-2 ${
                this.state.settings.showReplies ? 'btn-neutral' : 'btn-primary'
              }`}
              onClick={() =>
                this.setState({ settings: { ...this.state.settings, showReplies: false } })
              }
            >
              {t('posts')}
            </div>
            <div
              className={`btn btn-sm ${
                this.state.settings.showReplies ? 'btn-primary' : 'btn-neutral'
              }`}
              onClick={() =>
                this.setState({ settings: { ...this.state.settings, showReplies: true } })
              }
            >
              {t('posts_and_replies')}
            </div>
          </div>
        </Show>
        <Show when={index !== 'notifications'}>
          <FeedTypeSelector
            index={index}
            display={settings.display}
            setDisplay={(display) => {
              this.setState({
                displayCount: INITIAL_PAGE_SIZE,
                settings: { ...settings, display },
              });
              localState.get('settings').get('feed').get('display').put(display);
            }}
          />
        </Show>
        <Show when={this.state.events.length === 0}>
          <div className="px-2 md:px-4 py-2">{this.props.emptyMessage || t('no_events_yet')}</div>
        </Show>
        {renderAs === 'NoteImage' ? (
          <div className="grid grid-cols-3 gap-px xl:gap-1">{events}</div>
        ) : (
          events
        )}
        <Show when={displayCount < this.state.events.length}>
          <ShowMore
            onClick={() =>
              this.setState({
                displayCount: displayCount + INITIAL_PAGE_SIZE,
              })
            }
          />
        </Show>
      </div>
    );
  }
}

export default Feed;
