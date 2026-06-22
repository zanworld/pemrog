import { useState, useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(callback) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  
  // To avoid stale closures, keep a ref to the latest callback
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && !isFetching) {
        setIsFetching(true);
        // Call the latest callback
        if (callbackRef.current) {
          callbackRef.current();
        }
      }
    },
    [isFetching]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px', // Trigger slightly before hitting the bottom
      threshold: 0,
    });

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleObserver]);

  return [observerRef, isFetching, setIsFetching];
}
