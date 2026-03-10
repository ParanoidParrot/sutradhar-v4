import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Hook that finds the nearest scrollable container in the DOM
 * and forces overflow-y: auto on it after render.
 */
export default function useWebScroll() {
  const ref = useRef();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Wait for DOM to settle
    const timer = setTimeout(() => {
      // Find all divs with content taller than their container
      document.querySelectorAll('div').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 5) {
          const style = window.getComputedStyle(el);
          const overflow = style.overflow + style.overflowY;
          if (overflow.includes('hidden') || overflow.includes('visible')) {
            el.style.overflowY = 'auto';
            el.style.webkitOverflowScrolling = 'touch';
          }
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return ref;
}