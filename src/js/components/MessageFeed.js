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
    return html`
      <div class="feed-container">
        <${ScrollViewport} rowHeight=${165}>
          ${this.state.sortedMessages.map(hash => typeof hash === 'string' ? html`<${PublicMessage} hash=${hash} key=${hash} showName=${true} />` : '')}
        </${ScrollViewport}>
      </div>
    `;
  }
  /*
  adjustPaddings(isScrollDown) {
    const container = document.getElementById("container");
    const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
    const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
    const remPaddingsVal = 198 * (size / 2); // TODO: calculate actual element heights
    if (isScrollDown) {
      container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
      container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    } else {
      container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
      if (currentPaddingTop === 0) {
        $(window).scrollTop($('#post0').offset().top + remPaddingsVal);
      } else {
        container.style.paddingTop = currentPaddingTop - remPaddingsVal + "px";
      }
    }
  }

  topSentCallback(entry) {
    const container = document.getElementById("container");

    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling up
    if (
      currentY > topSentinelPreviousY &&
      isIntersecting &&
      currentRatio >= topSentinelPreviousRatio &&
      scroller.center !== previousUpIndex && // stop if no new results were received
      scroller.opts.stickTo !== 'top'
    ) {
      previousUpIndex = scroller.center;
      adjustPaddings(false);
      scroller.up(size / 2);
    }
    topSentinelPreviousY = currentY;
    topSentinelPreviousRatio = currentRatio;
  }

  botSentCallback(entry) {
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling down
    if (
      currentY < bottomSentinelPreviousY &&
      currentRatio > bottomSentinelPreviousRatio &&
      isIntersecting &&
      scroller.center !== previousDownIndex &&  // stop if no new results were received
      scroller.opts.stickTo !== 'bottom'
    ) {
      previousDownIndex = scroller.center;
      adjustPaddings(true);
      scroller.down(size / 2);
    }
    bottomSentinelPreviousY = currentY;
    bottomSentinelPreviousRatio = currentRatio;
  }

  initIntersectionObserver() {
    const options = {
      //rootMargin: '190px',
    }

    const callback = entries => {
      entries.forEach(entry => {
        if (entry.target.id === 'post0') {
          topSentCallback(entry);
        } else if (entry.target.id === `post${size - 1}`) {
          botSentCallback(entry);
        }
      });
    }

    var observer = new IntersectionObserver(callback, options); // TODO: It's possible to quickly scroll past the sentinels without them firing. Top and bottom sentinels should extend to page top & bottom?
    observer.observe(document.querySelector("#post0"));
    observer.observe(document.querySelector(`#post${size - 1}`));
  } */
}

export default MessageFeed;
