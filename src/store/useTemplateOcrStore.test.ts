import { beforeEach, describe, expect, it } from 'vitest';

import { initialBaseState } from './base/BaseOcrStore';
import { useTemplateOcrStore } from './useTemplateOcrStore';
import type { PresetRunResult } from '../lib/gemini/types';

const mockResult: PresetRunResult = {
  presetId: 'invoice',
  markdown: '# Invoice Extraction',
  json: {
    presetId: 'invoice',
    documentType: 'Invoice',
    summary: 'Structured extraction for invoice.',
    fields: {
      invoice_number: {
        value: 'INV-2026-0142',
        confidence: 0.94,
        required: true,
        type: 'text',
      },
    },
    rows: [
      {
        description: 'Monthly retainer',
        quantity: '1',
        unit_price: '1200.00',
        line_total: '1200.00',
      },
    ],
  },
  csv: 'description,quantity,unit_price,line_total\nMonthly retainer,1,1200.00,1200.00',
};

describe('useTemplateOcrStore', () => {
  beforeEach(() => {
    useTemplateOcrStore.setState({
      ...initialBaseState,
      presetId: 'invoice',
      result: null,
      fileName: '',
      progress: 0,
    });
  });

  it('clears stale artifacts when switching presets', () => {
    useTemplateOcrStore.setState({
      presetId: 'invoice',
      result: mockResult,
      fileName: 'invoice.pdf',
      progress: 1,
      error: 'Previous error',
      isCopied: true,
    });

    useTemplateOcrStore.getState().setPresetId('receipt');

    const state = useTemplateOcrStore.getState();
    expect(state.presetId).toBe('receipt');
    expect(state.result).toBeNull();
    expect(state.fileName).toBe('');
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
    expect(state.isCopied).toBe(false);
  });

  it('keeps the current preset and surfaces an error for unknown preset ids', () => {
    useTemplateOcrStore.getState().setPresetId('not-a-real-preset');

    const state = useTemplateOcrStore.getState();
    expect(state.presetId).toBe('invoice');
    expect(state.error).toContain('Unknown extraction preset');
  });

  it('preserves the current preset when resetting the store', () => {
    useTemplateOcrStore.setState({
      presetId: 'business-card',
      result: mockResult,
      fileName: 'card.png',
      progress: 0.8,
      error: 'Something went wrong',
      isProcessing: true,
      isCopied: true,
      abortController: new AbortController(),
    });

    useTemplateOcrStore.getState().reset();

    const state = useTemplateOcrStore.getState();
    expect(state.presetId).toBe('business-card');
    expect(state.result).toBeNull();
    expect(state.fileName).toBe('');
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.isCopied).toBe(false);
    expect(state.abortController).toBeNull();
  });
});
