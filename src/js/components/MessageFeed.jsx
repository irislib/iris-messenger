import { throttle } from 'lodash';
import styled from 'styled-components';

import Component from '../BaseComponent';
import Helpers from '../Helpers';
import Icons from '../Icons';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation';

import Button from './buttons/Button';
import EventComponent from './events/EventComponent';

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

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {
      sortedMessages: [],
      queuedMessages: [],
      displayCount: INITIAL_PAGE_SIZE,
      messagesShownTime: Math.floor(Date.now() / 1000),
      includeReplies: false,
      display: Helpers.getUrlParameter('display') === 'grid' ? 'grid' : 'posts',
      realtime: Helpers.getUrlParameter('realtime') === '1',
    };
    this.openedAt = Math.floor(Date.now() / 1000);
    this.mappedMessages = new Map();
  }

  updateSortedMessages = throttle(
    (sortedMessages) => {
      if (this.unmounted || !sortedMessages) {
        return;
      }
      // iterate over sortedMessages and add newer than messagesShownTime to queue
      const queuedMessages = [];
      let hasMyMessage;
      for (let i = 0; i < sortedMessages.length; i++) {
        const id = sortedMessages[i];
        const message = Events.cache.get(id);
        if (!this.state.realtime && message && message.created_at > this.state.messagesShownTime) {
          if (message.pubkey === Key.getPubKey() && !Events.isRepost(message)) {
            hasMyMessage = true;
            break;
          }
          queuedMessages.push(id);
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
    3000,
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
    let first = true;

    if (this.props.nostrUser) {
      if (this.props.index === 'postsAndReplies') {
        Events.getPostsAndRepliesByUser(this.props.nostrUser, (eventIds) =>
          this.updateSortedMessages(eventIds),
        );
      } else if (this.props.index === 'likes') {
        Events.getLikesByUser(this.props.nostrUser, (eventIds) => {
          this.updateSortedMessages(eventIds);
        });
      } else if (this.props.index === 'posts') {
        Events.getPostsByUser(this.props.nostrUser, (eventIds) =>
          this.updateSortedMessages(eventIds),
        );
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
          this.getMessagesByEveryone(this.state.includeReplies);
        } else if (this.props.index === 'notifications') {
          console.log('getMessagesByNotifications');
          Events.getNotifications((messages) => this.updateSortedMessages(messages));
        } else if (this.props.index === 'follows') {
          this.getMessagesByFollows(this.state.includeReplies);
        }
      }
    }
  }

  getMessagesByEveryone(includeReplies) {
    this.unsub = Events.getMessagesByEveryone((messages, cbIncludeReplies) => {
      this.state.includeReplies === cbIncludeReplies && this.updateSortedMessages(messages);
    }, includeReplies);
  }

  getMessagesByFollows(includeReplies) {
    Events.getMessagesByFollows((messages, cbIncludeReplies) => {
      this.state.includeReplies === cbIncludeReplies && this.updateSortedMessages(messages);
    }, includeReplies);
  }

  updateParams(prevState) {
    if (prevState.display !== this.state.display) {
      // url param ?display=images if display === 'grid', otherwise no param
      const url = new URL(window.location);
      if (this.state.display === 'grid') {
        url.searchParams.set('display', 'grid');
      } else {
        url.searchParams.delete('display');
      }
      window.history.replaceState({ ...window.history.state, state: this.state }, '', url);
    }
    if (prevState.includeReplies !== this.state.includeReplies) {
      // url param ?replies=1 if includeReplies === true, otherwise no param
      const url = new URL(window.location);
      if (this.state.includeReplies) {
        url.searchParams.set('replies', '1');
      } else {
        url.searchParams.delete('replies');
      }
      window.history.replaceState({ ...window.history.state, state: this.state }, '', url);
    }
    if (prevState.realtime !== this.state.realtime) {
      // url param ?realtime=1 if realtime === true, otherwise no param
      const url = new URL(window.location);
      if (this.state.realtime) {
        url.searchParams.set('realtime', '1');
      } else {
        url.searchParams.delete('realtime');
      }
      window.history.replaceState({ ...window.history.state, state: this.state }, '', url);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.scrollElement && this.props.scrollElement) {
      this.addScrollHandler();
    }
    this.updateParams(prevState);
    this.handleScroll();
    window.history.replaceState({ ...window.history.state, state: this.state }, '');
    if (!this.state.queuedMessages.length && prevState.queuedMessages.length) {
      Helpers.animateScrollTop('.main-view');
    }
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (
      prevNodeId !== newNodeId ||
      this.props.group !== prevProps.group ||
      this.props.path !== prevProps.path ||
      this.props.filter !== prevProps.filter ||
      this.props.keyword !== prevProps.keyword
    ) {
      this.mappedMessages = new Map();
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

  /*
  instead of renderFeedSelector() and renderFeedTypeSelector() let's do renderSettings()
  it contains all filters and display settings like state.display, state.realtime, state.includeReplies
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
                  checked={this.state.display === 'posts'}
                  onChange={() => this.setState({ display: 'posts' })}
                />
                <label htmlFor="display_posts">{t('posts')}</label>
                <input
                  type="radio"
                  name="display"
                  id="display_grid"
                  value="grid"
                  checked={this.state.display === 'grid'}
                  onChange={() => this.setState({ display: 'grid' })}
                />
                <label htmlFor="display_grid">{t('grid')}</label>
              </p>
              <p>
                <input
                  type="checkbox"
                  checked={this.state.includeReplies}
                  name="includeReplies"
                  id="include_replies"
                  onChange={() => this.setState({ includeReplies: !this.state.includeReplies })}
                />
                <label htmlFor="include_replies">{t('include_replies')}</label>
                <input
                  type="checkbox"
                  id="display_realtime"
                  checked={this.state.realtime}
                  onChange={() => this.setState({ realtime: !this.state.realtime })}
                />
                <label htmlFor="display_realtime">{t('realtime')}</label>
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

    const renderAs = this.state.display === 'grid' ? 'NoteImage' : null;
    const messages = this.state.sortedMessages
      .slice(0, displayCount)
      .map((id) => (
        <EventComponent
          notification={this.props.index === 'notifications'}
          key={id}
          id={id}
          showRepliedMsg={showRepliedMsg}
          renderAs={renderAs}
          feedOpenedAt={this.openedAt}
        />
      ));
    return (
      <div className="msg-feed">
        <div>
          {this.state.queuedMessages.length ? this.renderShowNewMessages() : null}
          {feedName ? (
            <div className="msg">
              <div className="msg-content notification-msg">
                <div style="display:flex;flex-direction: row;width:100%;align-items:center;text-align:center;">
                  <div style="flex:1">{t(feedName)}</div>
                  <a onClick={() => this.setState({ settingsOpen: !this.state.settingsOpen })}>
                    <i style="margin-right: 10px;color:var(--text-color);">{Icons.settings}</i>
                  </a>
                </div>
              </div>
            </div>
          ) : null}
          {this.props.index !== 'notifications' && this.state.settingsOpen && this.renderSettings()}
          {renderAs === 'NoteImage' ? <ImageGrid>{messages}</ImageGrid> : messages}
        </div>
        {displayCount < this.state.sortedMessages.length ? this.renderShowMore() : ''}
      </div>
    );
  }
}

export default MessageFeed;
