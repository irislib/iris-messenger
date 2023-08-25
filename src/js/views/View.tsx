import debounce from 'lodash/debounce';
import { useEffect, useRef } from 'preact/hooks';

import Header from '../components/header/Header.tsx';
import ErrorBoundary from '../components/helpers/ErrorBoundary.tsx';
import Show from '../components/helpers/Show';

import Search from './Search';

let isInitialLoad = true;
const listener = function () {
  isInitialLoad = false;
  window.removeEventListener('popstate', listener);
};
window.addEventListener('popstate', listener);

const View = ({ children, hideHeader = false, hideSideBar = false }) => {
  const restoreScrollPosition = () => {
    const currentHistoryState = window.history.state;
    const position = currentHistoryState?.scrollPosition || 0;
    window.scrollTo(0, position);
  };

  const saveScrollPosition = debounce(() => {
    const position = window.scrollY || document.documentElement.scrollTop;
    const currentHistoryState = window.history.state;
    const newHistoryState = {
      ...currentHistoryState,
      scrollPosition: position,
    };
    window.history.replaceState(newHistoryState, '');
  }, 100);

  useEffect(() => {
    if (!isInitialLoad) {
      restoreScrollPosition();
    } else {
      isInitialLoad = false;
    }
    window.addEventListener('scroll', saveScrollPosition);

    return () => {
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
          <Search key="search" focus={false} />
        </div>
      </Show>
    </div>
  );
};

export default View;
