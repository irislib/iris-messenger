import { throttle } from 'lodash';

import Component from '../BaseComponent';
import Button from './buttons/Button';
import Helpers from '../Helpers';
import localState from '../LocalState';
import Events from '../nostr/Events';
import Key from '../nostr/Key';
import { translate as t } from '../translations/Translation';

import EventComponent from './events/EventComponent';
import styled from "styled-components";
import Icons from "../Icons";

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
    };
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
        if (message && message.created_at > this.state.messagesShownTime) {
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
      this.handleScroll();
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

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.scrollElement && this.props.scrollElement) {
      this.addScrollHandler();
    }
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

  showQueuedMessages = (e) => {
    const sortedMessages = this.state.sortedMessages;
    sortedMessages.unshift(...this.state.queuedMessages);
    this.setState({
      sortedMessages,
      queuedMessages: [],
      messagesShownTime: Math.floor(Date.now() / 1000),
      displayCount: INITIAL_PAGE_SIZE,
    });
  };

  renderFeedSelector() {
    return (
      <div className="tabs">
        <a
          onClick={() => {
            if (this.state.includeReplies) {
              this.setState({ includeReplies: false });
              if (this.props.index === 'everyone') {
                this.getMessagesByEveryone(false);
                this.showQueuedMessages();
              } else if (this.props.index === 'follows') {
                this.getMessagesByFollows(false);
                this.showQueuedMessages();
              }
            }
          }}
          className={this.state.includeReplies ? '' : 'active'}
        >
          {t('posts')}
        </a>
        <a
          className={this.state.includeReplies ? 'active' : ''}
          onClick={() => {
            if (!this.state.includeReplies) {
              this.setState({ includeReplies: true });
              if (this.props.index === 'everyone') {
                this.getMessagesByEveryone(true);
              } else if (this.props.index === 'follows') {
                this.getMessagesByFollows(true);
              }
            }
          }}
        >
          {t('posts')} & {t('replies')}
        </a>
      </div>
    );
  }

  renderFeedTypeSelector() {
    return (
      <div className="tabs">
        <a
          style="border-radius: 8px 0 0 0"
          onClick={() => this.setState({ feedType: 'posts' })}
          className={this.state.feedType === 'images' ? '' : 'active'}
        >
          {Icons.document}
        </a>
        <a
          style="border-radius: 0 8px 0 0"
          className={this.state.feedType === 'images' ? 'active' : ''}
          onClick={() => this.setState({ feedType: 'images' })}
        >
          {Icons.image}
        </a>
      </div>
    );
  }

  renderShowNewMessages() {
    return (
      <div
        className={`msg ${this.state.showNewMsgsFixedTop ? 'fixedTop' : ''}`}
        onClick={this.showQueuedMessages}
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

    const renderAs = this.state.feedType === 'images' ? 'NoteImage' : null;
    const messages = this.state.sortedMessages
      .slice(0, displayCount)
      .map((id) => <EventComponent id={id} showRepliedMsg={showRepliedMsg} renderAs={renderAs} />);
    return (
      <div className="msg-feed">
        <div>
          {this.state.queuedMessages.length ? this.renderShowNewMessages() : null}
          {feedName ? (
            <div className="msg">
              <div className="msg-content notification-msg">{t(feedName)}</div>
            </div>
          ) : null}
          {['everyone', 'follows'].includes(this.props.index) ? this.renderFeedSelector() : ''}
          {this.props.index !== 'notifications' && this.renderFeedTypeSelector()}
          {renderAs === 'NoteImage' ? <ImageGrid>{messages}</ImageGrid> : messages}
        </div>
        {displayCount < this.state.sortedMessages.length ? this.renderShowMore() : ''}
      </div>
    );
  }
}

export default MessageFeed;
