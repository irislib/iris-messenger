import { Component } from '../lib/preact.js';
import Helpers, { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import ScrollViewport from '../lib/preact-scroll-viewport.js';
import State from '../State.js';

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[]};
    this.mappedMessages = new Map();
    this.eventListeners = {};
  }

  handleMessage(v, k, x, e, from) {
    if (from) { k = k + from; }
    if (!this.eventListeners['node']) {
      this.eventListeners['node'] = e;
    }
    if (v) {
      this.mappedMessages.set(k, this.props.keyIsMsgHash ? k : v);
    } else {
      this.mappedMessages.delete(k);
    }
    this.setState({
      sortedMessages: Array.from(this.mappedMessages.keys()).sort().reverse().map(k => this.mappedMessages.get(k))
    })
  }

  componentDidMount() {
    let first = true;
    State.local.get('scrollUp').on(() => {
      !first && Helpers.animateScrollTop('.main-view');
      first = false;
    });
    if (this.props.node) {
      this.props.node.map().on((...args) => this.handleMessage(...args));
    } else if (this.props.group && this.props.path) { // TODO: make group use the same basic gun api
      const group = this.props.group === 'follows' ?
        State.public.user().get('follow') :
        State.local.get('groups').get(this.props.group);
      State.group(group).map(this.props.path, (...args) => this.handleMessage(...args));
    }
  }

  unsubscribe() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path) {
      this.unsubscribe();
      this.mappedMessages = new Map();
      this.setState({sortedMessages: []});
      this.componentDidMount();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const thumbnails = this.props.thumbnails ? 'thumbnail-items' : '';
    return html`
      <div class="feed-container">
        <${ScrollViewport} class=${thumbnails} rowHeight=${165}>
          ${this.state.sortedMessages.map(
            hash => typeof hash === 'string' ? html`<${PublicMessage} thumbnail=${this.props.thumbnails} filter=${this.props.filter} hash=${hash} key=${hash} showName=${true} />` : ''
          )}
        </${ScrollViewport}>
      </div>
    `;
  }
}

export default MessageFeed;
