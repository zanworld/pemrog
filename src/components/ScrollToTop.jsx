import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);
    
    const resetScroll = () => {
      const containers = document.querySelectorAll('.overflow-y-auto');
      containers.forEach(container => {
        container.scrollTop = 0;
      });
    };

    resetScroll();
    
    // Run with a brief timeout to catch post-render scroll adjustments
    const timer = setTimeout(resetScroll, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
