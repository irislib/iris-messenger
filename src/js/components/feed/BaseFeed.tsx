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
import Show from '../helpers/Show';

import EventList from './EventList';
import FeedSettings from './FeedSettings';
import FeedTypeSelector from './FeedTypeSelector';
import ImageGrid from './ImageGrid';
import ShowMore from './ShowMore';
import ShowNewEvents from './ShowNewEvents';
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
  showReplies: false,
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
    let savedSettings = {};
    localState
      .get('settings')
      .get('feed')
      .once((s) => (savedSettings = s));
    this.state = {
      events: [],
      queuedEvents: [],
      displayCount: INITIAL_PAGE_SIZE,
      eventsShownTime: Math.floor(Date.now() / 1000),
      settings: this.getSettings(savedSettings),
    };
    this.openedAt = Math.floor(Date.now() / 1000);
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
        // TODO load more events
        this.setState({
          displayCount: this.state.displayCount + INITIAL_PAGE_SIZE, // TODO FIX!
        });
        console.log('load more events', this.state.displayCount);
      }
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
    let first = true;
    localState.get('scrollUp').on(
      this.sub(() => {
        !first && window.scrollTo(0, 0);
        first = false;
      }),
    );
  }

  componentWillMount() {
    if (!isInitialLoad && window.history.state?.state) {
      this.setState(window.history.state.state);
    }
  }

  subscribe() {
    this.unsub?.();
    clearTimeout(this.subscribeRetryTimeout);
    const results = new SortedEventMap(
      this.state.settings.sortBy,
      this.state.settings.sortDirection,
    );
    let twoSecondsPassed = false;
    setTimeout(() => {
      twoSecondsPassed = true;
    }, 2000);
    const update = () => {
      const events = results.events().map((event) => event.id);
      if (twoSecondsPassed && !this.state.settings.realtime && this.state.events.length > 5) {
        this.setState({ queuedEvents: events });
      } else {
        this.setState({ events, queuedEvents: [] });
      }
    };
    const debouncedUpdate = debounce(update, 1000, { leading: true });
    let updated = false;
    const callback = (event) => {
      if (results.has(event.id)) {
        return;
      }
      if (SocialNetwork.isBlocked(event.pubkey)) {
        return;
      }
      const repliedMsg = Events.getEventReplyingTo(event);
      if (repliedMsg) {
        if (!this.state.settings.showReplies) {
          return;
        }
        const author = Events.db.by('id', repliedMsg)?.pubkey;
        if (author && SocialNetwork.isBlocked(author)) {
          return;
        }
      }
      results.add(event);
      if (results.size > 10 && !updated) {
        // TODO should filter results (e.g. for images), only count what's shown
        updated = true;
        update();
      } else {
        debouncedUpdate();
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
    };
    go();
    if (results.size === 0) {
      this.subscribeRetryTimeout = setTimeout(go, 1000);
    }
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
      this.setState({ displayCount: INITIAL_PAGE_SIZE });
      this.subscribe();
    }
    this.handleScroll();
    this.replaceState();
    if (!this.state.queuedEvents.length && prevState.queuedEvents.length) {
      window.scrollTo(0, 0);
    }
    if (this.props.filter !== prevProps.filter || this.props.keyword !== prevProps.keyword) {
      this.setState({ events: [] });
      this.componentDidMount();
    }
  }

  showQueuedEvents() {
    this.setState({
      events: this.state.queuedEvents,
      queuedEvents: [],
      eventsShownTime: Math.floor(Date.now() / 1000),
      displayCount: INITIAL_PAGE_SIZE,
    });
    window.scrollTo(0, 0);
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
          <FeedSettings settings={settings} onChange={(settings) => this.setState({ settings })} />
        </Show>
        <Show when={['global', 'follows'].includes(index || '')}>
          <div className="flex items-center mx-2 md:mx-0 my-2">
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
              this.setState({ settings: { ...settings, display } });
              localState.get('settings').get('feed').get('display').put(display);
            }}
          />
        </Show>
        <Show when={this.state.events.length === 0}>
          <div className="msg">
            <div className="msg-content notification-msg">
              {this.props.emptyMessage || t('no_events_yet')}
            </div>
          </div>
        </Show>
        {renderAs === 'NoteImage' ? <ImageGrid>{events}</ImageGrid> : events}
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
