import Component from '../BaseComponent';
import Helpers from '../Helpers';
import PublicMessage from './PublicMessage';
import iris from 'iris-lib';
import Nostr from '../Nostr';
import { throttle } from 'lodash';
import { translate as t } from '../translations/Translation';
import Button from '../components/basic/Button';

const INITIAL_PAGE_SIZE = 40;

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = { sortedMessages: [], displayCount: INITIAL_PAGE_SIZE };
    this.mappedMessages = new Map();
  }

  updateSortedMessages = throttle(sortedMessages => {
    if (this.unmounted || !sortedMessages) {
      return;
    }
    this.setState({ sortedMessages });
  }, 3000, { leading: true });

  componentDidMount() {
    let first = true;
    if (this.props.nostrUser) {
      if (this.props.index === 'postsAndReplies') {
        Nostr.getPostsAndRepliesByUser(this.props.nostrUser, eventIds => this.updateSortedMessages(eventIds));
      } else if (this.props.index === 'likes') {
        Nostr.getLikesByUser(this.props.nostrUser, eventIds => {
          this.updateSortedMessages(eventIds)
        });
      } else if (this.props.index === 'posts') {
        Nostr.getPostsByUser(this.props.nostrUser, eventIds => this.updateSortedMessages(eventIds));
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
      if (this.props.index) { // public messages
        if (this.props.index === 'everyone') {
          Nostr.getMessagesByEveryone(messages => this.updateSortedMessages(messages));
        } else {
          Nostr.getMessagesByFollows(messages => this.updateSortedMessages(messages));
        }
      }
    }
  }

  componentDidUpdate(prevProps) {
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (
      prevNodeId !== newNodeId ||
      this.props.group !== prevProps.group ||
      this.props.path !== prevProps.path ||
      this.props.filter !== prevProps.filter
    ) {
      this.mappedMessages = new Map();
      this.setState({ sortedMessages: [] });
      this.componentDidMount();
    }
  }

  render() {
    if (!this.props.scrollElement || this.unmounted) {
      return;
    }
    const displayCount = this.state.displayCount;
    return (
      <>
        <div>
          {this.state.sortedMessages.slice(0, displayCount).map((hash) => (
            <PublicMessage key={hash} hash={hash} showName={true} />
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
