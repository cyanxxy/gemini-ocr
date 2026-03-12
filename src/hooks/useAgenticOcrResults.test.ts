import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAgenticOcrResults } from './useAgenticOcrResults';

describe('useAgenticOcrResults', () => {
  it('formats extracted fields into display content', () => {
    const { result } = renderHook(() => useAgenticOcrResults({
      extractedFields: {
        invoice_number: {
          value: 'INV-42',
          confidence: 0.92,
          validated: true,
          iteration: 2,
        },
      },
      currentIteration: 2,
      progress: 80,
      status: 'completed',
    }));

    expect(result.current.hasResults).toBe(true);
    expect(result.current.formattedContent.title).toBe('Agent Extraction Results');
    expect(result.current.formattedContent.sections[0]?.heading).toBe('invoice_number');
    expect(result.current.textContent).toContain('invoice_number: INV-42');
  });

  it('shows a fallback status section when the agent completes without fields', () => {
    const { result } = renderHook(() => useAgenticOcrResults({
      extractedFields: {},
      currentIteration: 0,
      progress: 0,
      status: 'completed',
    }));

    expect(result.current.hasResults).toBe(true);
    expect(result.current.formattedContent.title).toBe('No Content Extracted');
    expect(result.current.formattedContent.sections[0]?.content[0]).toContain('No fields were extracted');
  });
});
