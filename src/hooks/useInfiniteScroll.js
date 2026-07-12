import { useState, useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(callback) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Keep a ref to the latest callback to avoid stale closures
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Keep a ref to isFetching to avoid recreating the observer on every state change
  const isFetchingRef = useRef(isFetching);
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  // Stable handler — no dependencies that change frequently
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !isFetchingRef.current) {
      setIsFetching(true);
      if (callbackRef.current) {
        callbackRef.current();
      }
    }
  }, []);

  // Create the observer once, reuse it
  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '400px', // Trigger well before hitting the bottom
      threshold: 0,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Use a callback ref so we re-attach whenever the sentinel element mounts/unmounts
  const setObserverTarget = useCallback((node) => {
    // Detach from old element
    if (sentinelRef.current && observerRef.current) {
      observerRef.current.unobserve(sentinelRef.current);
    }

    sentinelRef.current = node;

    // Attach to new element
    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  return [setObserverTarget, isFetching, setIsFetching];
}
