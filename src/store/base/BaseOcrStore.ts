import { StateCreator } from 'zustand';
import { logger } from '../../lib/logger';

/**
 * Base state interface for all OCR stores
 */
export interface BaseOcrState {
  /** Whether processing is currently happening */
  isProcessing: boolean;
  /** Current error message if any */
  error: string | null;
  /** Whether content was recently copied to clipboard */
  isCopied: boolean;
  /** Timeout ID for copy notification */
  copyTimeoutId: ReturnType<typeof setTimeout> | null;
  /** AbortController for cancellable operations */
  abortController: AbortController | null;
}

/**
 * Base actions interface for all OCR stores
 */
export interface BaseOcrActions {
  /** Set error message */
  setError: (error: string | null) => void;
  /** Copy text to clipboard with feedback */
  copyToClipboard: (content: string) => Promise<void>;
  /** Reset common state */
  resetBase: () => void;
}

/**
 * Combined base store type
 */
export type BaseOcrStore = BaseOcrState & BaseOcrActions;

/**
 * Initial state for base OCR functionality
 */
export const initialBaseState: BaseOcrState = {
  isProcessing: false,
  error: null,
  isCopied: false,
  copyTimeoutId: null,
  abortController: null
};

/**
 * Creates base OCR store slice with common functionality
 * This eliminates ~400 lines of duplicate code across stores
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @returns Base store slice
 */
export const createBaseOcrSlice: StateCreator<
  BaseOcrStore,
  [],
  [],
  BaseOcrStore
> = (set, get) => ({
  ...initialBaseState,

  setError: (error: string | null) => {
    if (error) {
      logger.error('OCR Error:', error);
    }
    set({ error, isProcessing: false });
  },

  copyToClipboard: async (content: string) => {
    if (!content) {
      logger.warn('Attempted to copy empty content');
      return;
    }

    const { copyTimeoutId } = get();
    
    // Clear any existing timeout
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
    }

    try {
      await navigator.clipboard.writeText(content);
      
      // Set copied state and auto-clear after 2 seconds
      const newTimeoutId = setTimeout(() => {
        set({ isCopied: false, copyTimeoutId: null });
      }, 2000);
      
      set({ isCopied: true, copyTimeoutId: newTimeoutId });
      
      logger.info('Content copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
      set({ 
        error: 'Failed to copy to clipboard. Please try selecting and copying manually.',
        isCopied: false 
      });
    }
  },

  resetBase: () => {
    const { copyTimeoutId, abortController } = get();
    
    // Clean up timeouts
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
    }
    
    // Abort any ongoing operations
    if (abortController) {
      abortController.abort();
    }
    
    set(initialBaseState);
  }
});

/**
 * Helper to create abort controller for cancellable operations
 */
export const createAbortController = (): AbortController => {
  return new AbortController();
};

/**
 * Helper to handle errors consistently
 */
export const handleOcrError = (error: unknown, context: string): string => {
  let errorMessage: string;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'An unexpected error occurred';
  }
  
  logger.error(`${context}:`, error);
  return errorMessage;
};

/**
 * Utility to format content for clipboard
 */
export const formatContentForClipboard = (
  sections: Array<{ title?: string; content: string }>
): string => {
  return sections
    .filter(section => section.content)
    .map(section => {
      if (section.title) {
        return `${section.title}:\n${section.content}`;
      }
      return section.content;
    })
    .join('\n\n');
};