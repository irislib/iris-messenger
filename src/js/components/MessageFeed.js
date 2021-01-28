import { Component } from '../lib/preact.js';
import { createRef } from '../lib/preact.js';
import Helpers, { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import ScrollWindow from '../lib/ScrollWindow.js';
import State from '../State.js';

class MessageFeed extends Component {
  loadingRef = createRef();
  constructor() {
    super();
    this.state = {
      sortedMessages:[],
      loading: false,
      page: 0,
      prevY: 0,
      size: 5,
      sizeIncrement: 5,
    };
  }
  
  componentDidMount() {
    this.scroller = new ScrollWindow(this.props.node, {size: this.state.size, onChange: sortedMessages => {
      return this.setState({sortedMessages: sortedMessages.reverse()})
    }})

    var options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0
    };
    
    this.observer = new IntersectionObserver(
      this.handleObserver.bind(this),
      options
    );
    this.observer.observe(this.loadingRef.current);
  }

  handleObserver(entities, observer) {
    const y = entities[0].boundingClientRect.y;
    if (this.state.prevY > y) {
      const curPage = this.state.size + this.state.sizeIncrement;
      this.getSortedMessages(curPage);
      this.setState({ size: curPage });
    }
    this.setState({ prevY: y });
  }

  componentDidUpdate(newProps) {
    if (newProps.node !== this.props.node) {
      this.componentDidMount();
    }
  }

  getSortedMessages(size) {
    this.setState({ loading: true });
    setTimeout(() => {
      this.scroller = new ScrollWindow(this.props.node, {size, onChange: sortedMessages => {
      this.setState({ loading: false });
        return this.setState({sortedMessages: sortedMessages.reverse()})
      }})
    }, 1000);
  }

  topClicked() {
    this.scroller.top();
    const container = $(this.base).find('.feed-container');
    container.css({'padding-top': 0, 'padding-bottom': 0});
    Helpers.animateScrollTop('.main-view');
  }

  bottomClicked() {
    this.scroller.bottom();
    const container = $(this.base).find('.feed-container');
    container.css({'padding-top': 0, 'padding-bottom': 0});
  }

  render() {
    const loadingCSS = {
      height: "10px",
      margin: "30px"
    };

    const loadingTextCSS = { display: this.state.loading ? "block" : "none" };
    return html`
      <div class="feed-container">
        ${
          this.state.sortedMessages
          .map(hash => {
            return typeof hash === 'string' ? html`<${PublicMessage} hash=${hash} key=${hash} showName=${true} />` : ''})
        }
        <div
          ref=${this.loadingRef}
          style=${loadingCSS}
        >
          <div style=${loadingTextCSS} class="loading-ring"><div></div><div></div><div></div><div></div></div>
          <div style=${loadingTextCSS} class="loading-ring__helper"></div>
        </div>
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
