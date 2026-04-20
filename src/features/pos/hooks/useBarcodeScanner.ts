import { useEffect, useRef, useCallback } from 'react';

/**
 * Detects barcode scanner input (fast keystrokes ending in Enter).
 * Scanners type characters very fast (<50ms between keys) and end with Enter.
 * Regular typing is slower and won't trigger the callback.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef('');
  const lastKeyTime = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't intercept if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTime.current;

    if (e.key === 'Enter') {
      // If we have a buffer with 4+ chars accumulated quickly, it's a scan
      if (buffer.current.length >= 4) {
        e.preventDefault();
        onScanRef.current(buffer.current);
      }
      buffer.current = '';
      lastKeyTime.current = 0;
      return;
    }

    // Only accumulate printable single characters
    if (e.key.length !== 1) {
      buffer.current = '';
      return;
    }

    // If too much time between keystrokes, reset (human typing)
    if (timeSinceLastKey > 80) {
      buffer.current = '';
    }

    buffer.current += e.key;
    lastKeyTime.current = now;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
