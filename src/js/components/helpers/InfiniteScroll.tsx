import React, { useCallback, useEffect, useRef } from 'react';

import useHistoryState from '@/state/useHistoryState.ts';

type Props = {
  children: any;
  margin?: number;
  loadMore?: () => void;
};

const DEFAULT_INITIAL_DISPLAY_COUNT = 10;

const InfiniteScroll: React.FC<Props> = ({ children, margin = 2000, loadMore }) => {
  const [displayCount, setDisplayCount] = useHistoryState(
    DEFAULT_INITIAL_DISPLAY_COUNT,
    'scroller', // TODO use mandatory key prop, in case multiple infinite scrollers are used on the same page
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastLoadMoreCall = useRef<number>(0);

  const loadMoreWithCooldown = useCallback(() => {
    const now = Date.now();
    if (now - lastLoadMoreCall.current > 500 && loadMore) {
      loadMore();
      lastLoadMoreCall.current = now;
    }
  }, [loadMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const sentinelEntry = entries[0];
      if (sentinelEntry.isIntersecting) {
        window.requestAnimationFrame(() => {
          if (sentinelEntry.isIntersecting) {
            if (displayCount < children.length) {
              setDisplayCount((prev) => prev + 10);
            } else {
              loadMoreWithCooldown();
            }
          }
        });
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: margin + 'px',
      threshold: 0.1,
    });

    observer.observe(sentinelRef.current);

    // Check if the sentinel is in the viewport on mount after a requestAnimationFrame
    window.requestAnimationFrame(() => {
      if (
        sentinelRef.current &&
        sentinelRef.current.getBoundingClientRect().top - margin <= window.innerHeight
      ) {
        if (displayCount < children.length) {
          setDisplayCount((prev) => prev + 10);
        } else {
          loadMoreWithCooldown();
        }
      }
    });

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [children.length, displayCount, margin, loadMoreWithCooldown]);

  return (
    <>
      {children.slice(0, displayCount)}
      <div ref={sentinelRef}></div>
    </>
  );
};

export default InfiniteScroll;
