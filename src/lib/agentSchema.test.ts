import { describe, expect, it } from 'vitest';

import {
  getAgentDocumentSchema,
  getAgentReadiness,
  normalizeAgentDocumentType,
  normalizeAgentFieldName,
} from './agentSchema';

describe('agentSchema', () => {
  it('normalizes known document types', () => {
    expect(normalizeAgentDocumentType('Business_Card')).toBe('business card');
    expect(normalizeAgentDocumentType('CV')).toBe('resume');
    expect(normalizeAgentDocumentType('Invoice')).toBe('invoice');
  });

  it('maps alias field names to canonical schema names', () => {
    expect(normalizeAgentFieldName('business card', 'email_address')).toBe('email');
    expect(normalizeAgentFieldName('invoice', 'grand-total')).toBe('total_amount');
    expect(normalizeAgentFieldName('resume', 'candidate_name')).toBe('full_name');
  });

  it('reports missing required fields for schema-backed document types', () => {
    const readiness = getAgentReadiness({
      documentAnalysis: {
        pageCount: 1,
        documentType: 'invoice',
        complexity: 'medium',
        specialFeatures: [],
      },
      extractedFields: {
        vendor_name: { value: 'Northwind Supply Co.', confidence: 0.98 },
        invoice_number: { value: 'INV-2026-0142', confidence: 0.97 },
        invoice_date: { value: '2026-02-18', confidence: 0.95 },
        total_amount: { value: '1471.50', confidence: 0.99 },
      },
    });

    expect(getAgentDocumentSchema('invoice')?.requiredFields).toContain('customer_name');
    expect(readiness.missingRequiredFields).toEqual(['customer_name']);
    expect(readiness.requiredCoverage).toBeCloseTo(0.8);
    expect(readiness.averageConfidence).toBeGreaterThan(0.9);
  });
});
