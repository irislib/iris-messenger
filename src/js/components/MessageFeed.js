import { Component } from 'preact';
import Helpers, { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import {  List, WindowScroller,CellMeasurer,CellMeasurerCache,} from 'react-virtualized';
import State from '../State.js';
import 'react-virtualized/styles.css';
import $ from 'jquery';

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[]};
    this.mappedMessages = new Map();
    this.eventListeners = {};
    this._cache = new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 100,
    });
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentDidMount() {
    this.props.node.map().on((v, k, x, e) => {
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
    });
    let first = true;
    State.local.get('scrollUp').on(() => {
      !first && Helpers.animateScrollTop('.main-view');
      first = false;
    });
  }

  unsubscribe() {
    Object.values(this.eventListeners).forEach(e => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    if (this.props.node._.id !== prevProps.node._.id) {
      this.unsubscribe();
      this.setState({sortedMessages: [], mappedMessages: new Map()});
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  rowRenderer = ({ index, key, parent, style,isScrolling }) => {
    const hash = this.state.sortedMessages[index];
    const msg =
      typeof hash === "string"
        ? html`<${PublicMessage}
            filter=${this.props.filter}
            hash=${hash}
            key=${hash}
            showName=${true}
          />`
        : "";
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
            {typeof hash === "string"
              ? html`<${PublicMessage}
                  filter=${this.props.filter}
                  hash=${hash}
                  key=${hash}
                  measure=${() => {
                    measure();
                  }}
                  showName=${true}
                />`
              : ""}
          </div>
        )}
      </CellMeasurer>
    );
  };

  render() {
    return html`
      <div class="feed-container">
          <${WindowScroller} scrollElement=${$(".main-view")[0]}>
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
                />
              `;
            }}
          </${WindowScroller}>
      </div>
    `;
  }
}

export default MessageFeed;