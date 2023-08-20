import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'preact/hooks';

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

const View = ({ children, hideHeader = false, hideSideBar = false }) => {
  const observerRef = useRef<any>(null);

  const saveScrollPosition = debounce(() => {
    const position = window.scrollY || document.documentElement.scrollTop;
    const currentHistoryState = window.history.state;
    const newHistoryState = {
      ...currentHistoryState,
      scrollPosition: position,
    };
    window.history.replaceState(newHistoryState, '');
  }, 100);

  const restoreScrollPosition = (observe = true) => {
    const currentHistoryState = window.history.state;
    const previousHistoryState = window.history.state?.previousState;
    if (!isInitialLoad && currentHistoryState !== previousHistoryState) {
      observe && observeScrollElement();
      const position = window.history.state?.scrollPosition || 0;
      if (position) {
        window.scrollTo(0, position);
      }
    } else {
      const oldState = window.history.state || {};
      const newHistoryState = {
        ...oldState,
        previousState: currentHistoryState,
      };
      window.history.replaceState(newHistoryState, '');
    }
  };

  const observeScrollElement = () => {
    observerRef.current = new ResizeObserver((entries) => {
      entries.forEach(() => {
        restoreScrollPosition(false);
      });
    });

    observerRef.current.observe(document.body);
    setTimeout(() => {
      observerRef.current.disconnect();
    }, 1000);
  };

  useEffect(() => {
    restoreScrollPosition();
    window.addEventListener('scroll', saveScrollPosition);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, []);

  return (
    <div className="flex flex-row h-full w-full">
      <div className={`flex flex-col w-full h-full ${hideSideBar ? '' : 'lg:w-2/3'}`}>
        <Show when={!hideHeader}>
          <Header />
        </Show>
        <div className="h-full">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </div>
      <Show when={!hideSideBar}>
        <div className="flex-col hidden lg:flex lg:w-1/3">
          <Search focus={false} />
        </div>
      </Show>
    </div>
  );
};

export default View;
