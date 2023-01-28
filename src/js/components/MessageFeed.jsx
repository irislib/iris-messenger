import iris from 'iris-lib';
import { throttle } from 'lodash';

import Component from '../BaseComponent';
import Button from '../components/basic/Button';
import Helpers from '../Helpers';
import Nostr from '../Nostr';
import { translate as t } from '../translations/Translation';

import PublicMessage from './PublicMessage';

const INITIAL_PAGE_SIZE = 20;

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {
      sortedMessages: [],
      queuedMessages: [],
      displayCount: INITIAL_PAGE_SIZE,
      messagesShownTime: Math.floor(Date.now() / 1000),
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
        const hash = sortedMessages[i];
        const message = Nostr.eventsById.get(hash);
        if (message && message.created_at > this.state.messagesShownTime) {
          if (message.pubkey === iris.session.getKey().secp256k1.rpub) {
            hasMyMessage = true;
            break;
          }
          queuedMessages.push(hash);
        }
      }
      if (!hasMyMessage) {
        sortedMessages = sortedMessages.filter((hash) => !queuedMessages.includes(hash));
      }
      const messagesShownTime = hasMyMessage
        ? Math.floor(Date.now() / 1000)
        : this.state.messagesShownTime;
      this.setState({ sortedMessages, queuedMessages, messagesShownTime });
      this.checkScrollPosition();
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
    const showNewMsgsFixedTop = this.props.scrollElement.scrollTop > this.base.offsetTop;
    if (showNewMsgsFixedTop !== this.state.fixedTop) {
      this.setState({ showNewMsgsFixedTop });
    }
  };

  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.props.scrollElement) {
      this.props.scrollElement.removeEventListener('scroll', this.handleScroll);
    }
  }

  componentDidMount() {
    this.props.scrollElement?.addEventListener('scroll', this.handleScroll);
    let first = true;
    if (this.props.nostrUser) {
      if (this.props.index === 'postsAndReplies') {
        Nostr.getPostsAndRepliesByUser(this.props.nostrUser, (eventIds) =>
          this.updateSortedMessages(eventIds),
        );
      } else if (this.props.index === 'likes') {
        Nostr.getLikesByUser(this.props.nostrUser, (eventIds) => {
          this.updateSortedMessages(eventIds);
        });
      } else if (this.props.index === 'posts') {
        Nostr.getPostsByUser(this.props.nostrUser, (eventIds) =>
          this.updateSortedMessages(eventIds),
        );
      }
    } else {
      iris
        .local()
        .get('scrollUp')
        .on(
          this.sub(() => {
            !first && Helpers.animateScrollTop('.main-view');
            first = false;
          }),
        );
      if (this.props.keyword) {
        const keyword = this.props.keyword;
        Nostr.getMessagesByKeyword(this.props.keyword, (messages) => {
          if (this.props.keyword == keyword)
            this.updateSortedMessages(messages);
	});
      } else if (this.props.index) {
        // public messages
        if (this.props.index === 'everyone') {
          Nostr.getMessagesByEveryone((messages) => this.updateSortedMessages(messages));
        } else if (this.props.index === 'notifications') {
          console.log('getMessagesByNotifications');
          Nostr.getNotifications((messages) => this.updateSortedMessages(messages));
        } else {
          Nostr.getMessagesByFollows((messages) => this.updateSortedMessages(messages));
        }
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.scrollElement && this.props.scrollElement) {
      this.props.scrollElement.addEventListener('scroll', this.handleScroll);
    }
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

  render() {
    if (!this.props.scrollElement || this.unmounted) {
      return;
    }
    const displayCount = this.state.displayCount;
    const showRepliedMsg = this.props.index !== 'likes';
    return (
      <>
        <div>
          {this.state.queuedMessages.length ? (
            <div
              style={{ cursor: 'pointer' }}
              className={`msg ${this.state.showNewMsgsFixedTop ? 'fixedTop' : ''}`}
              onClick={this.showQueuedMessages}
            >
              <div className="msg-content notification-msg">
                Show {this.state.queuedMessages.length} new message
                {this.state.queuedMessages.length > 1 ? 's' : ''}
              </div>
            </div>
          ) : null}
          {this.state.sortedMessages.slice(0, displayCount).map((hash) => (
            <PublicMessage key={hash} hash={hash} showName={true} showRepliedMsg={showRepliedMsg} />
          ))}
        </div>
        {displayCount < this.state.sortedMessages.length ? (
          <p>
            <Button
              onClick={() =>
                this.setState({
                  displayCount: displayCount + INITIAL_PAGE_SIZE,
                })
              }
            >
              {t('show_more')}
            </Button>
          </p>
        ) : (
          ''
        )}
      </>
    );
  }
}

export default MessageFeed;
