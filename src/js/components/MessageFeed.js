import { Component } from 'preact';
import Helpers, { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import {  List, WindowScroller,CellMeasurer,CellMeasurerCache,} from 'react-virtualized';
import State from '../State.js';
import 'react-virtualized/styles.css';
import _ from 'lodash';

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[]};
    this.mappedMessages = new Map();
    this.eventListeners = {};
    this._cache = new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 0,
    });
    this.rowRenderer = this.rowRenderer.bind(this);
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

    this.updateSortedMessages = this.updateSortedMessages || _.debounce(() => {
      this.setState({
        sortedMessages: Array.from(this.mappedMessages.keys()).sort().reverse().map(k => this.mappedMessages.get(k))
      })
    }, 200);

    this.updateSortedMessages();
  }

  componentDidMount() {
    console.log(this.props);
    let first = true;
    State.local.get('scrollUp').on(() => {
      !first && Helpers.animateScrollTop('.main-view');
      first = false;
    });
    if (this.props.node) {
      this.props.node.map().on((...args) => this.handleMessage(...args));
    } else if (this.props.group && this.props.path) { // TODO: make group use the same basic gun api
      const group = State.local.get('groups').get(this.props.group);
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
    if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path || this.props.filter !== prevProps.filter) {
      this.unsubscribe();
      this.mappedMessages = new Map();
      this.setState({sortedMessages: []});
      this.componentDidMount();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  rowRenderer({ index, key, parent, style }) { // TODO: use isScrolling param to reduce rendering?
    const hash = this.state.sortedMessages[index];
    return (
      <CellMeasurer
        cache={this._cache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}
      >
        {({ measure, registerChild }) => (
          <div ref={registerChild} style={style}>
            {measure()}
            <PublicMessage
              filter={this.props.filter}
              hash={hash}
              key={hash}
              measure={() => {
                measure();
              }}
              showName={true}
            />
          </div>
        )}
      </CellMeasurer>
    );
  }

  render() {
    if (!this.props.scrollElement) { return; }
    return html`
      <div class="feed-container">
          <${WindowScroller} scrollElement=${this.props.scrollElement}>
            ${({ height, width, isScrolling, onChildScroll, scrollTop }) => {
              return html`
                <${List}
                  autoHeight
                  autoWidth
                  width=${width}
                  height=${height}
                  isScrolling=${isScrolling}
                  onScroll=${onChildScroll}
                  scrollTop=${scrollTop}
                  rowCount=${this.state.sortedMessages.length}
                  rowHeight=${this._cache.rowHeight}
                  rowRenderer=${this.rowRenderer}
                  overscanRowCount=${10}
                />
              `;
            }}
          </${WindowScroller}>
      </div>
    `;
  }
}

export default MessageFeed;