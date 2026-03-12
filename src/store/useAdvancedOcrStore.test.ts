import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/fileUtils', () => ({
  validateFile: vi.fn(() => ({ valid: true })),
  readFileAsDataUrl: vi.fn(async () => 'data:image/png;base64,test'),
}));

vi.mock('../lib/gemini/extraction', () => ({
  extractTextFromFile: vi.fn(),
}));

import { extractTextFromFile } from '../lib/gemini/extraction';
import { useAdvancedOcrStore } from './useAdvancedOcrStore';
import { useSettingsStore } from './useSettingsStore';

describe('useAdvancedOcrStore', () => {
  beforeEach(() => {
    useAdvancedOcrStore.getState().reset();
    useSettingsStore.setState({
      apiKey: 'test-key',
      model: 'gemini-3-flash-preview',
      handwritingMode: false,
      theme: 'light',
      thinkingConfig: {
        level: 'HIGH',
        includeThoughts: false,
      },
    });
    vi.clearAllMocks();
  });

  it('treats aborts as cancellation instead of failed results', async () => {
    const file = new File(['demo'], 'receipt.png', { type: 'image/png' });
    await useAdvancedOcrStore.getState().addFiles([file]);

    vi.mocked(extractTextFromFile).mockImplementation(async () => {
      throw new Error('Request aborted');
    });

    await useAdvancedOcrStore.getState().processFiles();

    const state = useAdvancedOcrStore.getState();
    expect(state.processedResults).toEqual([]);
    expect(state.error).toBe('Processing cancelled');
    expect(state.isProcessing).toBe(false);
  });
});
