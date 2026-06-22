import { useState, useEffect } from 'react';

export default function useIdleTimer(timeout = 3000, isPaused = false) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (isPaused) {
      setIsIdle(false);
      return;
    }

    let idleTimeout;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => setIsIdle(true), timeout);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    resetTimer(); // Initialize timer

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(idleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, isPaused]);

  return { isIdle, setIsIdle };
}
