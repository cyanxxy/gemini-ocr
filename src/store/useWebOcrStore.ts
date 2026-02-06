import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BaseOcrStore, 
  createBaseOcrSlice, 
  handleOcrError,
  formatContentForClipboard
} from './base/BaseOcrStore';
import { extractTextFromUrlsProgressive } from '../lib/gemini/urlOperations';
import { useSettingsStore } from './useSettingsStore';
import { logger } from '../lib/logger';

export interface UrlResult {
  url: string;
  content: string;
  type: 'webpage' | 'image' | 'pdf' | 'unknown';
  title?: string;
  error?: string;
}

interface WebOcrState extends BaseOcrStore {
  urls: string[];
  results: UrlResult[];
  combinedContent: string;
  analysisMode: 'individual' | 'combined' | 'comparison';
}

interface WebOcrActions {
  setUrls: (urls: string[]) => void;
  processUrls: (apiKey: string) => Promise<void>;
  setAnalysisMode: (mode: WebOcrState['analysisMode']) => void;
  clearResults: () => void;
  copyUrlResults: () => Promise<void>;
  reset: () => void;
}

type WebOcrStore = WebOcrState & WebOcrActions;

const initialState: Omit<WebOcrState, keyof BaseOcrStore> = {
  urls: [''],
  results: [],
  combinedContent: '',
  analysisMode: 'individual'
};

export const useWebOcrStore = create<WebOcrStore>()(
  persist(
    (set, get) => ({
      ...createBaseOcrSlice(set, get),
      ...initialState,
      
      setUrls: (urls: string[]) => {
        set({ urls });
      },
      
      processUrls: async (apiKey: string) => {
        const { urls, analysisMode } = get();

        // Get model and thinkingConfig from settings store
        const { model, thinkingConfig } = useSettingsStore.getState();

        // Filter out empty URLs
        const validUrls = urls.filter(url => url.trim());

        if (validUrls.length === 0) {
          set({ error: 'Please enter at least one valid URL' });
          return;
        }

        if (validUrls.length > 20) {
          set({ error: 'Maximum 20 URLs allowed per request' });
          return;
        }

        // Validate URL formats
        const invalidUrls: string[] = [];
        validUrls.forEach(url => {
          try {
            new URL(url);
          } catch {
            invalidUrls.push(url);
          }
        });

        if (invalidUrls.length > 0) {
          set({
            error: `Invalid URL format: ${invalidUrls.join(', ')}`
          });
          return;
        }

        // Always create a fresh AbortController to avoid race conditions
        const controller = new AbortController();
        set({
          isProcessing: true,
          error: null,
          results: [],
          combinedContent: '',
          abortController: controller
        });
        
        try {
          logger.info(`Processing ${validUrls.length} URLs in ${analysisMode} mode`);
          
          // Try URL extraction with automatic fallback
          // Pass model and thinkingConfig to the progressive extraction
          const response = await extractTextFromUrlsProgressive(
            validUrls,
            apiKey,
            analysisMode,
            model,
            thinkingConfig,
            controller.signal
          );
          
          if (controller.signal.aborted) {
            throw new Error('Operation cancelled');
          }
          
          // Parse results based on analysis mode
          let results: UrlResult[] = [];
          let combinedContent = '';
          
          if (analysisMode === 'individual') {
            // Parse individual results
            results = response.results || [];
            combinedContent = results
              .filter(r => !r.error)
              .map(r => `## ${r.url}\n\n${r.content}`)
              .join('\n\n---\n\n');
          } else if (analysisMode === 'combined') {
            // All content combined
            combinedContent = response.combinedContent || '';
            results = validUrls.map(url => ({
              url,
              content: 'See combined results',
              type: 'unknown' as const
            }));
          } else if (analysisMode === 'comparison') {
            // Comparison analysis
            combinedContent = response.comparisonAnalysis || '';
            results = response.results || [];
          }
          
          set({
            results,
            combinedContent,
            isProcessing: false,
            abortController: null
          });
          
          logger.info('URL processing completed successfully');
        } catch (error) {
          const errorMessage = handleOcrError(error, 'URL processing failed');
          set({
            error: errorMessage,
            isProcessing: false,
            abortController: null
          });
        }
      },
      
      setAnalysisMode: (mode: WebOcrState['analysisMode']) => {
        set({ analysisMode: mode });
      },
      
      clearResults: () => {
        set({
          results: [],
          combinedContent: '',
          error: null
        });
      },
      
      copyUrlResults: async () => {
        const { results, combinedContent, analysisMode, copyToClipboard } = get();
        
        let contentToCopy = '';
        
        if (analysisMode === 'individual' && results.length > 0) {
          contentToCopy = formatContentForClipboard(
            results.map(r => ({
              title: r.url,
              content: r.error || r.content
            }))
          );
        } else if (combinedContent) {
          contentToCopy = combinedContent;
        }
        
        if (contentToCopy) {
          await copyToClipboard(contentToCopy);
        }
      },
      
      reset: () => {
        const { resetBase } = get();
        resetBase();
        set(initialState);
      }
    }),
    {
      name: 'web-ocr-storage',
      partialize: (state) => ({
        urls: state.urls,
        analysisMode: state.analysisMode
      })
    }
  )
);
