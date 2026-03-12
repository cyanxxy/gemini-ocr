import { describe, expect, it } from 'vitest';
import { applyMemoryUpdate } from './agentLoop';
import type { AgentMemory } from './agentTypes';

function createMemory(): AgentMemory {
  return {
    sessionId: 'session-1',
    documentName: 'invoice.pdf',
    currentIteration: 1,
    extractedFields: {
      invoice_number: {
        value: 'INV-1',
        confidence: 0.8,
      },
    },
    processingHistory: [],
    documentAnalysis: {
      pageCount: 1,
      documentType: 'invoice',
      complexity: 'medium',
      specialFeatures: [],
    },
    confidence: 0.8,
    lastUpdated: 100,
  };
}

describe('applyMemoryUpdate', () => {
  it('merges extracted fields, document analysis, and history items', () => {
    const memory = createMemory();

    applyMemoryUpdate(memory, {
      extractedFields: {
        total: {
          value: '1471.50',
          confidence: 0.95,
        },
      },
      documentAnalysis: {
        pageCount: 2,
        specialFeatures: ['table'],
      },
      confidence: 0.91,
      lastUpdated: 200,
      processingHistoryItem: {
        type: 'result',
        content: 'Applied update',
        timestamp: 123,
      },
    });

    expect(memory.extractedFields.total?.value).toBe('1471.50');
    expect(memory.documentAnalysis.pageCount).toBe(2);
    expect(memory.documentAnalysis.specialFeatures).toEqual(['table']);
    expect(memory.confidence).toBe(0.91);
    expect(memory.lastUpdated).toBe(200);
    expect(memory.processingHistory).toHaveLength(1);
  });

  it('does nothing when no update is provided', () => {
    const memory = createMemory();

    applyMemoryUpdate(memory);

    expect(memory.extractedFields.invoice_number?.value).toBe('INV-1');
    expect(memory.processingHistory).toHaveLength(0);
  });

  it('keeps the higher-confidence version of a field when updates collide', () => {
    const memory = createMemory();

    applyMemoryUpdate(memory, {
      extractedFields: {
        invoice_number: {
          value: 'INV-1-low',
          confidence: 0.4,
          extractedAt: 200,
        },
      },
    });

    expect(memory.extractedFields.invoice_number?.value).toBe('INV-1');

    applyMemoryUpdate(memory, {
      extractedFields: {
        invoice_number: {
          value: 'INV-1-final',
          confidence: 0.95,
          extractedAt: 300,
        },
      },
    });

    expect(memory.extractedFields.invoice_number?.value).toBe('INV-1-final');
    expect(memory.extractedFields.invoice_number?.confidence).toBe(0.95);
  });
});
