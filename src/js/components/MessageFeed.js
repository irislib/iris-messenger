import { Component } from '../lib/preact.js';
import { html } from '../Helpers.js';
import PublicMessage from './PublicMessage.js';
import ScrollWindow from '../lib/ScrollWindow.js';

const size = 20;

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

class MessageFeed extends Component {
  constructor() {
    super();
    this.state = {sortedMessages:[]};
    this.topSentinelPreviousY = 0;
    this.topSentinelPreviousRatio = 0;
    this.bottomSentinelPreviousY = 0;
    this.bottomSentinelPreviousRatio = 0;
    this.previousUpIndex = this.previousDownIndex = -1;
    this.deb = _.debounce(s => this.setState(s), 20);
  }

  componentDidMount() {
    this.setState({sortedMessages:[]});
    this.scroller = new ScrollWindow(this.props.node, {size, onChange: sortedMessages => {
      //this.setState({sortedMessages: sortedMessages.reverse()})
      this.deb({sortedMessages: sortedMessages.reverse()});
    }});
    this.scroller.top();
    this.initIntersectionObserver();
    localState.get('activeRoute').on(() => {
      this.scroller.top();
    });
  }

  componentDidUpdate(newProps) {
    if (newProps.node._.link !== this.props.node._.link) {
      this.componentDidMount();
    }
  }

  topClicked() {
    this.scroller.top();
    const container = $(this.base);
    container.css({'padding-top': 0, 'padding-bottom': 0});
    $('.main-view').animate({ scrollTop: 0 }, 500);
  }

  bottomClicked() {
    this.scroller.bottom();
    const container = $(this.base);
    container.css({'padding-top': 0, 'padding-bottom': 0});
    $('.main-view').animate({ scrollTop: container.height() }, 500);
  }

  render() {
    const showButtons = this.scroller && this.scroller.elements.size >= size;
    return html`
      <div class="feed-container">
        ${[...Array(size).keys()].map(n => {
          const hash = this.state.sortedMessages[n];
          return html`
          <div class="item${n}">
            ${typeof hash === 'string' ? html`<${PublicMessage} hash=${hash} key=${hash} showName=${true} />` : ''}
          </div>
        `})}
      </div>
    `;
  }

  adjustPaddings(isScrollDown) {
    const container = this.base;
    const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
    const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
    let remPaddingsVal = 0;
    if (isScrollDown) {
      $(this.base).children().each(function(i) {
        if (i >= size / 2) return false;
        remPaddingsVal += $(this).outerHeight(true);
      });
      container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
      container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    } else {
      $(this.base).children().each(function(i) {
        if (i >= size / 2) remPaddingsVal += $(this).outerHeight(true);
      });
      container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
      if (currentPaddingTop === 0) {
        $('.main-view').scrollTop($('.item0').offset().top + remPaddingsVal);
      } else {
        container.style.paddingTop = currentPaddingTop - remPaddingsVal + "px";
      }
    }
  }

  topSentCallback(entry) {
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling up
    if (
      currentY > this.topSentinelPreviousY &&
      isIntersecting &&
      currentRatio >= this.topSentinelPreviousRatio &&
      this.scroller.center !== this.previousUpIndex && // stop if no new results were received
      this.scroller.opts.stickTo !== 'top'
    ) {
      this.previousUpIndex = this.scroller.center;
      this.adjustPaddings(false);
      this.scroller.up(size / 2);
    }
    this.topSentinelPreviousY = currentY;
    this.topSentinelPreviousRatio = currentRatio;
  }

  botSentCallback(entry) {
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    // conditional check for Scrolling down
    if (
      currentY < this.bottomSentinelPreviousY &&
      currentRatio > this.bottomSentinelPreviousRatio &&
      isIntersecting &&
      this.scroller.center !== this.previousDownIndex &&  // stop if no new results were received
      this.scroller.opts.stickTo !== 'bottom'
    ) {
      this.previousDownIndex = this.scroller.center;
      this.adjustPaddings(true);
      this.scroller.down(size / 2);
    }
    this.bottomSentinelPreviousY = currentY;
    this.bottomSentinelPreviousRatio = currentRatio;
  }

  initIntersectionObserver() {
    const options = {
      root: document.querySelector('.main-view'),
      rootMargin: '400px'
    }

    const callback = entries => {
      if (this.scroller.elements.size < size) return;
      entries.forEach(entry => {
        if (entry.target.className === 'item0') {
          this.topSentCallback(entry);
        } else if (entry.target.className === `item${size - 1}`) {
          this.botSentCallback(entry);
        }
      });
    }

    var observer = new IntersectionObserver(callback, options); // TODO: It's possible to quickly scroll past the sentinels without them firing. Top and bottom sentinels should extend to page top & bottom?
    observer.observe($(this.base).find('.item0')[0]);
    observer.observe($(this.base).find(`.item${size - 1}`)[0]);
  }
}

export default MessageFeed;
