import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);
    
    // Reset any container scroll that has vertical overflow scrolling
    const containers = document.querySelectorAll('.overflow-y-auto');
    containers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
