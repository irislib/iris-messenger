import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  children: any;
  margin?: number;
  loadMore?: () => void;
};

const InfiniteScroll: React.FC<Props> = ({ children, margin = 2000, loadMore }) => {
  const [displayCount, setDisplayCount] = useState<number>(10);
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
    <div>
      {React.Children.toArray(children).slice(0, displayCount)}
      <div ref={sentinelRef}></div>
    </div>
  );
};

export default InfiniteScroll;
