import { useEffect, useRef, useState } from 'preact/hooks';

const INCREASE_BY = 5;

type Props = { children: any; margin?: string; loadMore?: () => void };

// TODO save scroll position to history state
function InfiniteScroll({ children, margin = '2000px', loadMore }: Props) {
  const [visibleCount, setVisibleCount] = useState(INCREASE_BY);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (sentinelRef.current && !observerRef.current) {
      const options = {
        root: null,
        rootMargin: margin,
        threshold: 0,
      };

      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => prev + INCREASE_BY);

            if (loadMore && visibleCount >= children.length) {
              loadMore?.();
            }
          }
        });
      }, options);

      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [visibleCount, margin, loadMore, children.length]);

  return (
    <>
      {children.slice(0, visibleCount)}
      {visibleCount < children.length && <div ref={sentinelRef} />}
    </>
  );
}

export default InfiniteScroll;
