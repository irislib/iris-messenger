import { useEffect, useRef, useState } from 'preact/hooks';

const INCREASE_BY = 5;

type Props = { children: any; margin?: string; loadMore?: () => void };

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
  }, [margin, loadMore, children.length]);

  useEffect(() => {
    if (loadMore && visibleCount >= children.length) {
      loadMore();
    }
  }, [visibleCount, children.length, loadMore]);

  return (
    <>
      {children.slice(0, visibleCount)}
      {visibleCount < children.length && <div ref={sentinelRef} />}
    </>
  );
}

export default InfiniteScroll;
