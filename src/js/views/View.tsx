import { debounce } from 'lodash';
import { JSX } from 'preact';

import Component from '../BaseComponent';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Show from '../components/helpers/Show';

import Search from './Search';

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
  hideSideBar = false;

  abstract renderView(): JSX.Element;

  render() {
    return (
      <div className="flex flex-row w-full">
        <div className={`flex flex-col w-full ${this.hideSideBar ? '' : 'lg:w-2/3'}`}>
          <Header />
          <div class={this.class} id={this.id}>
            <ErrorBoundary>{this.renderView()}</ErrorBoundary>
          </div>
        </div>
        <Show when={!this.hideSideBar}>
          <div className="flex-col hidden lg:flex lg:w-1/3">
            <Search focus={false} />
          </div>
        </Show>
      </div>
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
