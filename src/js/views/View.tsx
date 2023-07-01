import { debounce } from 'lodash';
import { JSX } from 'preact';

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
  class = '';
  id = '';
  observer: ResizeObserver | null = null;
  scrollPosition = 0;

  abstract renderView(): JSX.Element;

  render() {
    return (
      <>
        <Header />
        <div class={this.class} id={this.id}>
          <ErrorBoundary>{this.renderView()}</ErrorBoundary>
        </div>
      </>
    );
  }

  componentDidMount() {
    window.addEventListener('scroll', this.saveScrollPosition);
    this.restoreScrollPosition();
  }

  saveScrollPosition = debounce(() => {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const currentHistoryState = window.history.state;
    const newHistoryState = {
      ...currentHistoryState,
      scrollPosition,
    };
    window.history.replaceState(newHistoryState, '');
  }, 100);

  restoreScrollPosition(observe = true) {
    const currentHistoryState = window.history.state;
    const previousHistoryState = window.history.state?.previousState;
    if (!isInitialLoad && currentHistoryState !== previousHistoryState) {
      observe && this.observeScrollElement();
      if (!this.scrollPosition) {
        this.scrollPosition = window.history.state?.scrollPosition;
      }
      if (this.scrollPosition) {
        window.scrollTo(0, this.scrollPosition);
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

    this.observer.observe(document.body);
    setTimeout(() => {
      if (this.observer) {
        this.observer.disconnect();
      }
    }, 1000);
  };

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('scroll', this.saveScrollPosition);
  }
}

export default View;
