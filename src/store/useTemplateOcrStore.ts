import { create } from 'zustand';
import { createAbortController, createBaseOcrSlice, handleOcrError, type BaseOcrStore } from './base/BaseOcrStore';
import { readFileAsDataUrl, validateFile } from '../lib/fileUtils';
import { logger } from '../lib/logger';
import { useSettingsStore } from './useSettingsStore';
import { getExtractionPreset, runExtractionPreset } from '../lib/templates';
import type { PresetRunResult } from '../lib/gemini/types';

type ArtifactKind = 'markdown' | 'json' | 'csv';

interface TemplateOcrState {
  presetId: string;
  result: PresetRunResult | null;
  fileName: string;
  progress: number;
}

interface TemplateOcrActions {
  setPresetId: (presetId: string) => void;
  processFile: (file: File, apiKey: string) => Promise<void>;
  cancelExtraction: () => void;
  reset: () => void;
  copyArtifact: (kind: ArtifactKind) => Promise<void>;
}

type TemplateOcrStore = BaseOcrStore & TemplateOcrState & TemplateOcrActions;

export const useTemplateOcrStore = create<TemplateOcrStore>((set, get) => ({
  ...createBaseOcrSlice(set, get),
  presetId: 'invoice',
  result: null,
  fileName: '',
  progress: 0,

  setPresetId: (presetId) => {
    try {
      getExtractionPreset(presetId);
    } catch (error) {
      set({
        error: handleOcrError(error, 'Unknown template preset'),
      });
      return;
    }

    set({
      presetId,
      result: null,
      fileName: '',
      progress: 0,
      error: null,
      isCopied: false,
    });
  },

  processFile: async (file, apiKey) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      set({ error: validation.error || 'Invalid file', isProcessing: false });
      return;
    }

    const abortController = createAbortController();
    const { model, thinkingConfig } = useSettingsStore.getState();
    let preset;
    try {
      preset = getExtractionPreset(get().presetId);
    } catch (error) {
      set({
        error: handleOcrError(error, 'Unknown template preset'),
        isProcessing: false,
      });
      return;
    }

    set({
      isProcessing: true,
      error: null,
      fileName: file.name,
      progress: 0.05,
      result: null,
      abortController,
    });

    try {
      const dataUrl = await readFileAsDataUrl(file);

      if (abortController.signal.aborted) {
        throw new Error('Extraction cancelled');
      }

      await runExtractionPreset(
        dataUrl,
        file.type,
        { apiKey, model, thinkingConfig },
        preset,
        { abortSignal: abortController.signal },
        {
          onProgress: (chunk) => {
            if (abortController.signal.aborted) {
              throw new Error('Extraction cancelled');
            }

            logger.debug('Template extraction chunk received:', chunk.length);
            set((state) => {
              const remaining = 0.9 - state.progress;
              const increment = remaining * 0.18;
              return { progress: Math.min(state.progress + Math.max(increment, 0.01), 0.9) };
            });
          },
          onComplete: (result) => {
            if (abortController.signal.aborted) {
              return;
            }

            set({
              result,
              isProcessing: false,
              progress: 1,
              error: null,
              abortController: null,
            });
          },
          onError: (error) => {
            if (abortController.signal.aborted) {
              return;
            }

            set({
              error: handleOcrError(error, 'Template extraction failed'),
              isProcessing: false,
              progress: 0,
              abortController: null,
            });
          },
        },
      );
    } catch (error) {
      if (abortController.signal.aborted || (error instanceof Error && error.message === 'Extraction cancelled')) {
        set({
          error: 'Extraction cancelled',
          isProcessing: false,
          progress: 0,
          abortController: null,
        });
        return;
      }

      set({
        error: handleOcrError(error, 'Failed to process template'),
        isProcessing: false,
        progress: 0,
        abortController: null,
      });
    }
  },

  cancelExtraction: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({
        isProcessing: false,
        error: 'Extraction cancelled',
        progress: 0,
        abortController: null,
      });
    }
  },

  reset: () => {
    const { resetBase } = get();
    resetBase();
    set({
      presetId: get().presetId,
      result: null,
      fileName: '',
      progress: 0,
    });
  },

  copyArtifact: async (kind) => {
    const { result } = get();
    if (!result) {
      return;
    }

    const artifact = kind === 'markdown'
      ? result.markdown
      : kind === 'json'
        ? JSON.stringify(result.json, null, 2)
        : result.csv;

    if (!artifact) {
      set({ error: `No ${kind.toUpperCase()} artifact available for this preset run.` });
      return;
    }

    await get().copyToClipboard(artifact);
  },
}));
