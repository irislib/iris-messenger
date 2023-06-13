import { debounce } from 'lodash';
import { createRef, JSX } from 'preact';

import Component from '../BaseComponent';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';

let isInitialLoad = true;
const listener = function () {
  isInitialLoad = false;
  window.removeEventListener('popstate', listener);
};
window.addEventListener('popstate', listener);

abstract class View extends Component {
  scrollElement = createRef();
  class = '';
  id = '';
  observer: ResizeObserver | null = null;
  scrollPosition = 0;

  abstract renderView(): JSX.Element;

  render() {
    return (
      <>
        <Header />
        <div
          ref={this.scrollElement}
          onScroll={() => this.saveScrollPosition()}
          class={this.class}
          id={this.id}
        >
          <ErrorBoundary>{this.renderView()}</ErrorBoundary>
        </div>
      </>
    );
  }

  saveScrollPosition = debounce(() => {
    const scrollElement = this.scrollElement.current;
    if (scrollElement) {
      const scrollPosition = scrollElement.scrollTop;
      const currentHistoryState = window.history.state;
      const newHistoryState = {
        ...currentHistoryState,
        scrollPosition,
      };
      window.history.replaceState(newHistoryState, '');
    }
  }, 100);

  restoreScrollPosition(observe = true) {
    const currentHistoryState = window.history.state;
    const previousHistoryState = window.history.state?.previousState;
    if (!isInitialLoad && currentHistoryState !== previousHistoryState) {
      observe && this.observeScrollElement();
      const scrollElement = this.scrollElement.current;
      if (!this.scrollPosition) {
        this.scrollPosition = window.history.state?.scrollPosition;
      }
      if (scrollElement && this.scrollPosition) {
        scrollElement.scrollTop = this.scrollPosition;
      }
    } else {
      const oldState = window.history.state || {};
      const newHistoryState = {
        ...oldState,
        previousState: currentHistoryState,
      };
      window.history.replaceState(newHistoryState, '');
    }
  }

  observeScrollElement = () => {
    this.observer = new ResizeObserver((entries) => {
      entries.forEach(() => {
        this.restoreScrollPosition(false);
      });
    });

    const scrollElement = this.scrollElement.current;
    if (scrollElement) {
      this.observer.observe(scrollElement);
      setTimeout(() => {
        if (this.observer) {
          this.observer.disconnect();
        }
      }, 1000);
    }
  };

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export default View;
