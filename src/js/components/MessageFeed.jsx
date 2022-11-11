import Component from '../BaseComponent';
import Helpers from '../Helpers';
import PublicMessage from './PublicMessage';
import iris from 'iris-lib';
import { debounce } from 'lodash';
import { translate as t } from '../translations/Translation';
import Button from '../components/basic/Button';

const INITIAL_PAGE_SIZE = 20;

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = { sortedMessages: [], displayCount: INITIAL_PAGE_SIZE };
    this.mappedMessages = new Map();
  }

  updateSortedMessages = debounce(() => {
    if (this.unmounted) {
      return;
    }
    let sortedMessages = Array.from(this.mappedMessages.keys())
      .sort()
      .map((k) => this.mappedMessages.get(k));
    if (!this.props.reverse) {
      sortedMessages = sortedMessages.reverse();
    }
    this.setState({ sortedMessages });
  }, 100);

  handleMessage(v, k, x, e, from) {
    if (from) {
      k = k + from;
    }
    if (v) {
      if (this.props.keyIsMsgHash) {
        // likes and replies are not indexed by timestamp, so we need to fetch all the messages to sort them by timestamp
        PublicMessage.fetchByHash(this, k).then((msg) => {
          if (msg) {
            this.mappedMessages.set(msg.signedData.time, k);
            this.updateSortedMessages();
          }
        });
      } else if (v.length < 45) {
        // filter out invalid hashes. TODO: where are they coming from?
        this.mappedMessages.set(k, v);
      }
    } else {
      this.mappedMessages.delete(k);
    }

    this.updateSortedMessages();
  }

  componentDidMount() {
    let first = true;
    iris
      .local()
      .get('scrollUp')
      .on(
        this.sub(() => {
          !first && Helpers.animateScrollTop('.main-view');
          first = false;
        }),
      );
    if (this.props.node) {
      this.props.node.map().on(this.sub((...args) => this.handleMessage(...args)));
    } else if (this.props.group && this.props.path) {
      // TODO: make group use the same basic gun api
      iris.group(this.props.group).map(
        this.props.path,
        this.sub((...args) => this.handleMessage(...args)),
      );
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
