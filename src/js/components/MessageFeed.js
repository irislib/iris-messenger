import { Component } from 'preact';
import Helpers, { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import {List, WindowScroller} from 'react-virtualized';
import State from '../State.js';
import 'react-virtualized/styles.css';
import $ from 'jquery';

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[]};
    this.mappedMessages = new Map();
    this.eventListeners = {};
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

  render() {
    const rowRenderer = ({ key, style, index }) => {
      const hash = this.state.sortedMessages[index];
      const msg = typeof hash === 'string' ? html`<${PublicMessage} filter=${this.props.filter} hash=${hash} key=${hash} showName=${true} />` : '';
      return html`
        <div key=${key} style=${style}>
          ${msg}
        </div>
      `;
    }

    return html`
      <div class="feed-container">
          <${WindowScroller} scrollElement=${$('.main-view')[0]}>
            ${({ height, width, isScrolling, onChildScroll, scrollTop }) => html`
              <${List}
                autoHeight
                autoWidth
                width=${width}
                height=${height}
                isScrolling=${isScrolling}
                onScroll=${onChildScroll}
                scrollTop=${scrollTop}
                rowCount=${this.state.sortedMessages.length}
                rowHeight=${165}
                rowRenderer=${rowRenderer}
              />
            `}
          </${WindowScroller}>
      </div>
    `;
  }
}

export default MessageFeed;
