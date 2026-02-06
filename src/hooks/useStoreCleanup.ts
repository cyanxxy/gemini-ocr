import { useEffect } from 'react';
import { logger } from '../lib/logger';

/**
 * Hook for cleaning up store state when components unmount.
 * Ensures consistent cleanup pattern across all pages and prevents memory leaks.
 * 
 * @param cleanupFunctions - Object containing cleanup functions to call on unmount
 * @param storeName - Optional name for debugging purposes
 * 
 * @example
 * ```tsx
 * // Single store cleanup
 * useStoreCleanup({
 *   reset: useOcrStore.getState().reset,
 *   cancelExtraction: useOcrStore.getState().cancelExtraction
 * }, 'OcrStore');
 * 
 * // Multiple stores cleanup
 * useStoreCleanup({
 *   resetOcr: useOcrStore.getState().reset,
 *   resetSettings: useSettingsStore.getState().reset
 * });
 * ```
 */
export function useStoreCleanup(
  cleanupFunctions: Record<string, (() => void) | undefined> = {},
  storeName?: string
): void {
  useEffect(() => {
    return () => {
      logger.debug(`Cleaning up ${storeName || 'store'} on component unmount`);
      
      // Call all cleanup functions (check if cleanupFunctions exists)
      if (cleanupFunctions && typeof cleanupFunctions === 'object') {
        Object.entries(cleanupFunctions).forEach(([name, fn]) => {
          if (typeof fn === 'function') {
            try {
              fn();
              logger.debug(`Called cleanup function: ${name}`);
            } catch (error) {
              logger.error(`Error in cleanup function ${name}:`, error);
            }
          }
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount
}

/**
 * Specialized cleanup hook for OCR stores that have standard reset and cancelExtraction methods
 */
export function useOcrStoreCleanup<T extends { reset: () => void; cancelExtraction?: () => void }>(
  store: T,
  storeName?: string
): void {
  useStoreCleanup(
    {
      cancelExtraction: store.cancelExtraction,
      reset: store.reset
    },
    storeName
  );
}