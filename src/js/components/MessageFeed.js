import { Component } from "preact";
import Helpers, { html } from "../Helpers.js";
import PublicMessage from "./PublicMessage.js";
import { List, WindowScroller } from "react-virtualized";
import State from "../State.js";
import "react-virtualized/styles.css";
import $ from "jquery";

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = { sortedMessages: [] };
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
<<<<<<< HEAD
    this.props.node.map().on((v, k, x, e) => {
      if (!this.eventListeners["node"]) {
        this.eventListeners["node"] = e;
      }
      if (v) {
        this.mappedMessages.set(k, this.props.keyIsMsgHash ? k : v);
      } else {
        this.mappedMessages.delete(k);
      }
      this.setState({
        sortedMessages: Array.from(this.mappedMessages.keys())
          .sort()
          .reverse()
          .map((k) => this.mappedMessages.get(k)),
      });
    });
=======
>>>>>>> cff4cb424607e0617843a0d9c156fc54fe4e518b
    let first = true;
    State.local.get("scrollUp").on(() => {
      !first && Helpers.animateScrollTop(".main-view");
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
    Object.values(this.eventListeners).forEach((e) => e.off());
    this.eventListeners = {};
  }

  componentDidUpdate(prevProps) {
    const prevNodeId = prevProps.node && prevProps.node._ && prevProps.node._.id;
    const newNodeId = this.props.node && this.props.node._ && this.props.node._.id;
    if (prevNodeId !== newNodeId || this.props.group !== prevProps.group || this.props.path !== prevProps.path) {
      this.unsubscribe();
<<<<<<< HEAD
      this.setState({ sortedMessages: [], mappedMessages: new Map() });
=======
      this.mappedMessages = new Map();
      this.setState({sortedMessages: []});
      this.componentDidMount();
>>>>>>> cff4cb424607e0617843a0d9c156fc54fe4e518b
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
<<<<<<< HEAD
    const RowRenderer = ({ key, style, index }) => {
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
      return html` <div key=${key} style=${style}>${msg}</div> `;
    };
    return this.state.sortedMessages.map((item, index) => {
      console.log("It is coming here", item);
      return <RowRenderer key={item} index={index}></RowRenderer>;
    });
    //   return html`
    //   <div class="feed-container">
    //       <${WindowScroller} scrollElement=${$(".main-view")[0]}>
    //         ${({
    //           height,
    //           width,
    //           isScrolling,
    //           onChildScroll,
    //           scrollTop,
    //         }) => html`
    //           <${List}
    //             autoHeight
    //             autoWidth
    //             width=${width}
    //             height=${height}
    //             isScrolling=${isScrolling}
    //             onScroll=${onChildScroll}
    //             scrollTop=${scrollTop}
    //             rowCount=${this.state.sortedMessages.length}
    //             rowHeight=${165}
    //             rowRenderer=${rowRenderer}
    //           />
    //         `}
    //       </${WindowScroller}>
    //   </div>
    // `;
=======
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
>>>>>>> cff4cb424607e0617843a0d9c156fc54fe4e518b
  }
}

export default MessageFeed;
