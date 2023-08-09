import { useEffect } from 'react';

const LOAD_MORE_MARGIN = '0px 0px 2000px 0px';

export default function useInfiniteScroll(
  target: React.RefObject<Element>,
  callback: () => void,
  hasMore: boolean,
): void {
  useEffect(() => {
    if (target.current && hasMore) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback();
          }
        },
        {
          threshold: 0.0,
          rootMargin: LOAD_MORE_MARGIN,
        },
      );
      observer.observe(target.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [target, callback, hasMore]);
}
