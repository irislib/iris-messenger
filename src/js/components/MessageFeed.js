import Component from '../BaseComponent';
import Helpers from '../Helpers';
import { html } from 'htm/preact';
import PublicMessage from './PublicMessage';
import State from '../State';
import _ from 'lodash';
import {translate as t} from '../Translation';

const PAGE_SIZE = 40;

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[], displayCount: PAGE_SIZE};
    this.mappedMessages = new Map();
  }

  handleMessage(v, k, x, e, from) {
    if (from) { k = k + from; }
    if (v) {
      this.mappedMessages.set(k, this.props.keyIsMsgHash ? k : v);
    } else {
      this.mappedMessages.delete(k);
    }

    this.updateSortedMessages = this.updateSortedMessages || _.debounce(() => {
      if (this.unmounted) { return; }
      let sortedMessages = Array.from(this.mappedMessages.keys()).sort().map(k => this.mappedMessages.get(k));
      if (!this.props.reverse) {
        sortedMessages = sortedMessages.reverse();
      }
      this.setState({sortedMessages})
    }, 100);

    this.updateSortedMessages();
  }

  componentDidMount() {
    let first = true;
    State.local.get('scrollUp').on(this.sub(
      () => {
        !first && Helpers.animateScrollTop('.main-view');
        first = false;
      }
    ));
    if (this.props.node) {
      this.props.node.map().on(this.sub(
        (...args) => this.handleMessage(...args)
      ));
    } else if (this.props.group && this.props.path) { // TODO: make group use the same basic gun api
      State.group(this.props.group).map(this.props.path, this.sub(
        (...args) => this.handleMessage(...args)
      ));
    }
  }

  componentDidUpdate(prevProps) {
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path || this.props.filter !== prevProps.filter) {
      this.mappedMessages = new Map();
      this.setState({sortedMessages: []});
      this.componentDidMount();
    }
  }

  render() {
    if (!this.props.scrollElement || this.unmounted) { return; }
    const displayCount = this.state.displayCount;
    return html`
      ${this.state.sortedMessages.slice(0, displayCount).map(hash => html`
        <${PublicMessage} key=${hash} hash=${hash} showName=${true} />
      `)}
      ${displayCount < this.state.sortedMessages.length ? html`
        <p>
          <button onClick=${() => this.setState({displayCount: displayCount + PAGE_SIZE})}>
            ${t('show_more')}
          </button>
        </p>
      ` : ''}
    `;
  }
}

export default MessageFeed;