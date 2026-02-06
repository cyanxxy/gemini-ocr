import { AgentFunctionResult, AgentMemory } from './agentTypes';
import { extractTextFromFile } from './gemini/extraction';
import { FunctionDeclaration } from '@google/genai';
import { logger } from './logger';
import { useSettingsStore } from '../store/useSettingsStore';

// Runtime validation helpers for Gemini function call args

function assertString(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new TypeError(`Expected non-empty string for "${key}", got ${typeof v}`);
  }
  return v;
}

function assertNumber(args: Record<string, unknown>, key: string): number {
  const v = args[key];
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new TypeError(`Expected number for "${key}", got ${typeof v}`);
  }
  return v;
}

function assertObject(args: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = args[key];
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new TypeError(`Expected object for "${key}", got ${typeof v}`);
  }
  return v as Record<string, unknown>;
}

export const AGENT_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: 're_ocr_region',
    description: 'Re-process a specific region of the document with higher focus to improve accuracy.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'The page number to re-process.' },
        region: { type: 'string', description: 'A description of the region to focus on (e.g., "top-left corner", "the table in the middle").' },
        focus: { type: 'string', description: 'Specific text or type of content to focus on within the region.' },
        confidence_threshold: { type: 'number', description: 'The confidence threshold to aim for (0.0 to 1.0).' },
      },
      required: ['page', 'region', 'focus'],
    },
  },
  {
    name: 'extract_field',
    description: 'Extract and validate a specific field from the document.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        field_name: { type: 'string', description: 'The name of the field to extract (e.g., "invoice_number", "customer_name").' },
        field_value: { type: 'string', description: 'The extracted value of the field.' },
        confidence: { type: 'number', description: 'The confidence score of the extraction (0.0 to 1.0).' },
        validation_rule: { type: 'string', description: 'An optional validation rule to apply (e.g., "email", "phone", "date").' },
        location: { type: 'object', description: 'The bounding box of the extracted field.' },
      },
      required: ['field_name', 'field_value', 'confidence'],
    },
  },
  {
    name: 'validate_extraction',
    description: 'Validate extracted data against document context or business rules.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        fields: { type: 'object', description: 'The fields to validate as a key-value pair.' },
        validation_type: { type: 'string', description: 'The type of validation to perform (e.g., "format", "consistency", "completeness").' },
        context: { type: 'string', description: 'Optional context for business rule validation.' },
      },
      required: ['fields', 'validation_type'],
    },
  },
  {
    name: 'analyze_document_structure',
    description: 'Analyze the overall structure and layout of the document.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        document_type: { type: 'string', description: 'The identified type of the document (e.g., "invoice", "resume", "report").' },
        layout_analysis: { type: 'object', description: 'A description of the document layout (e.g., columns, sections, tables).' },
        extraction_strategy: { type: 'string', description: 'The recommended strategy for extraction (e.g., "form-based", "table-based", "full-text").' },
        confidence: { type: 'number', description: 'The confidence in the analysis (0.0 to 1.0).' },
      },
      required: ['document_type', 'layout_analysis', 'extraction_strategy', 'confidence'],
    },
  },
  {
    name: 'finalize_extraction',
    description: 'Finalize the extraction process and provide a summary.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        extracted_fields: { type: 'object', description: 'All the fields that have been extracted.' },
        overall_confidence: { type: 'number', description: 'The overall confidence in the extracted data.' },
        extraction_summary: { type: 'string', description: 'A summary of the extraction process.' },
        recommendations: { type: 'string', description: 'Optional recommendations for improvement.' },
        quality_score: { type: 'number', description: 'A final quality score for the extraction.' },
      },
      required: ['extracted_fields', 'overall_confidence', 'extraction_summary', 'quality_score'],
    },
  },
];

/**
 * Tool implementations for agent function calls
 */

/**
 * Re-process a specific region of the document with higher focus
 */
export async function executeReOcrRegion(
  args: Record<string, unknown>,
  fileData: string,
  mimeType: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  try {
    const page = assertNumber(args, 'page');
    const region = assertString(args, 'region');
    const focus = assertString(args, 'focus');
    const confidence_threshold = typeof args.confidence_threshold === 'number' ? args.confidence_threshold : 0.7;

    // Create focused extraction instruction
    const instruction = {
      title: `Re-OCR Region - ${region}`,
      prompt: `Focus specifically on ${region} on page ${page}. 
        Pay special attention to ${focus}. 
        This is a re-processing attempt to improve accuracy.
        
        Requirements:
        - Extract text with high precision
        - Focus only on the specified region: ${region}
        - Prioritize ${focus}
        - Provide confidence scores for extracted text
        - If handwritten text, analyze each character carefully
        - Mark uncertain text with [?]
        
        Return the extracted text with confidence assessment.`
    };

    // Call the existing OCR function with focused instructions
    const { apiKey, model, thinkingConfig } = useSettingsStore.getState();

    const result = await extractTextFromFile(
      fileData,
      mimeType,
      { apiKey, model, thinkingConfig },
      [instruction],
      {
        handwritingStyle: 'general',
        outputFormat: 'markdown',
        detectImages: false
      }
    );

    return {
      success: true,
      data: {
        extractedText: result,
        region,
        page,
        focus,
        confidence: confidence_threshold,
      },
      memoryUpdate: {
        processingHistoryItem: {
          type: 'function_call',
          content: `Re-OCR performed on page ${page}, region: ${region}`,
          functionCall: { name: 're_ocr_region', arguments: args },
          functionResult: { success: true, data: result },
          timestamp: Date.now(),
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Re-OCR failed',
    };
  }
}

/**
 * Extract and validate a specific field
 */
export async function executeExtractField(
  args: Record<string, unknown>,
  _fileData: string,
  _mimeType: string,
  memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  try {
    const field_name = assertString(args, 'field_name');
    const field_value = assertString(args, 'field_value');
    const confidence = assertNumber(args, 'confidence');
    const validation_rule = typeof args.validation_rule === 'string' ? args.validation_rule : undefined;
    const location = typeof args.location === 'object' && args.location !== null ? args.location as Record<string, unknown> : undefined;

    // Validate the field value based on the validation rule
    let isValid = true;
    let validationMessage = '';

    if (validation_rule) {
      const validationResult = validateFieldValue(field_value, validation_rule);
      isValid = validationResult.isValid;
      validationMessage = validationResult.message;
    }

    // Prepare the new field data
    // Note: location is stored as a JSON string for compatibility with field storage
    const newFieldData = {
      value: field_value,
      confidence,
      validation_rule,
      location: location ? JSON.stringify(location) : undefined,
      isValid,
      validationMessage,
      extractedAt: Date.now(),
    };

    // Calculate new overall confidence without mutating
    // We simulate adding the new field to the existing ones
    const simulatedFields = { ...memory.extractedFields, [field_name]: newFieldData };
    const fieldConfidences = Object.values(simulatedFields).map(field => field.confidence);
    const newOverallConfidence = fieldConfidences.reduce((sum, conf) => sum + conf, 0) / fieldConfidences.length;

    return {
      success: true,
      data: {
        field_name,
        field_value,
        confidence,
        isValid,
        validationMessage,
        location,
      },
      memoryUpdate: {
        extractedFields: { [field_name]: newFieldData },
        confidence: newOverallConfidence,
        processingHistoryItem: {
          type: 'function_call',
          content: `Field extracted: ${field_name} = ${field_value}`,
          functionCall: { name: 'extract_field', arguments: args },
          functionResult: { success: true, data: { field_name, field_value, confidence, isValid } },
          timestamp: Date.now(),
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Field extraction failed',
    };
  }
}

/**
 * Validate extracted data against document context
 */
export async function executeValidateExtraction(
  args: Record<string, unknown>,
  _fileData: string,
  _mimeType: string,
  memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  try {
    const fields = assertObject(args, 'fields');
    const validation_type = typeof args.validation_type === 'string' ? args.validation_type : 'format';
    const context = typeof args.context === 'string' ? args.context : undefined;

    const validationResults: Record<string, { isValid: boolean; message: string }> = {};

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      let validationResult = { isValid: true, message: '' };

      switch (validation_type) {
        case 'format':
          validationResult = validateFieldFormat(fieldValue as string, fieldName);
          break;
        case 'consistency':
          validationResult = validateFieldConsistency(fieldValue as string, fieldName, memory);
          break;
        case 'completeness':
          validationResult = validateFieldCompleteness(fieldValue as string, fieldName);
          break;
        case 'cross_reference':
          validationResult = validateFieldCrossReference(fieldValue as string, fieldName, memory);
          break;
        case 'business_rules':
          validationResult = validateBusinessRules(fieldValue as string, fieldName, context);
          break;
        default:
          validationResult = { isValid: true, message: 'Unknown validation type' };
      }

      validationResults[fieldName] = validationResult;
    }

    return {
      success: true,
      data: validationResults,
      memoryUpdate: {
        processingHistoryItem: {
          type: 'function_call',
          content: `Validation performed: ${validation_type}`,
          functionCall: { name: 'validate_extraction', arguments: args },
          functionResult: { success: true, data: validationResults },
          timestamp: Date.now(),
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Analyze document structure
 */
export async function executeAnalyzeDocumentStructure(
  args: Record<string, unknown>,
  _fileData: string,
  _mimeType: string,
  memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  try {
    const document_type = assertString(args, 'document_type');
    const layout_analysis = assertObject(args, 'layout_analysis');
    const extraction_strategy = assertString(args, 'extraction_strategy');
    const confidence = assertNumber(args, 'confidence');

    // New document analysis state
    const newDocumentAnalysis = {
      pageCount: memory.documentAnalysis.pageCount,
      documentType: document_type,
      complexity: determineComplexity(layout_analysis),
      specialFeatures: extractSpecialFeatures(layout_analysis),
    };

    return {
      success: true,
      data: {
        document_type,
        layout_analysis,
        extraction_strategy,
        confidence,
        complexity: newDocumentAnalysis.complexity,
        specialFeatures: newDocumentAnalysis.specialFeatures,
      },
      memoryUpdate: {
        documentAnalysis: newDocumentAnalysis,
        processingHistoryItem: {
          type: 'function_call',
          content: `Document structure analyzed: ${document_type}`,
          functionCall: { name: 'analyze_document_structure', arguments: args },
          functionResult: { success: true, data: { document_type, extraction_strategy, confidence } },
          timestamp: Date.now(),
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Document analysis failed',
    };
  }
}

/**
 * Finalize extraction process
 */
export async function executeFinalizeExtraction(
  args: Record<string, unknown>,
  _fileData: string,
  _mimeType: string,
  memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  try {
    const overall_confidence = assertNumber(args, 'overall_confidence');
    const extraction_summary = assertString(args, 'extraction_summary');
    const recommendations = typeof args.recommendations === 'string' ? args.recommendations : undefined;
    const quality_score = assertNumber(args, 'quality_score');

    // Use the maximum of current tracked confidence and agent-provided confidence
    // This preserves the carefully calculated confidence from extract_field calls
    // while allowing the agent to increase confidence if warranted
    const finalConfidence = Math.max(memory.confidence, overall_confidence);

    return {
      success: true,
      data: {
        overall_confidence: finalConfidence,
        extraction_summary,
        recommendations,
        quality_score,
        fieldCount: Object.keys(memory.extractedFields).length,
      },
      memoryUpdate: {
        confidence: finalConfidence,
        lastUpdated: Date.now(),
        processingHistoryItem: {
          type: 'result',
          content: `Extraction finalized: ${extraction_summary}`,
          functionCall: { name: 'finalize_extraction', arguments: args },
          functionResult: { success: true, data: { overall_confidence: finalConfidence, quality_score } },
          timestamp: Date.now(),
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Finalization failed',
    };
  }
}

// Helper functions

/**
 * Validate field value based on validation rule
 */
function validateFieldValue(value: string, rule: string): { isValid: boolean; message: string } {
  switch (rule) {
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(value),
        message: emailRegex.test(value) ? 'Valid email format' : 'Invalid email format',
      };
    }
    case 'phone': {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      return {
        isValid: phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10,
        message: phoneRegex.test(value) ? 'Valid phone format' : 'Invalid phone format',
      };
    }
    case 'date': {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/;
      return {
        isValid: dateRegex.test(value),
        message: dateRegex.test(value) ? 'Valid date format' : 'Invalid date format',
      };
    }
    case 'currency': {
      const currencyRegex = /^\$?\d+(\.\d{2})?$/;
      return {
        isValid: currencyRegex.test(value),
        message: currencyRegex.test(value) ? 'Valid currency format' : 'Invalid currency format',
      };
    }
    case 'number': {
      const numberRegex = /^\d+(\.\d+)?$/;
      return {
        isValid: numberRegex.test(value),
        message: numberRegex.test(value) ? 'Valid number format' : 'Invalid number format',
      };
    }
    default:
      return { isValid: true, message: 'No validation rule applied' };
  }
}

/**
 * Validate field format
 */
function validateFieldFormat(value: string, fieldName: string): { isValid: boolean; message: string } {
  // Basic format validation based on field name patterns
  if (fieldName.toLowerCase().includes('email')) {
    return validateFieldValue(value, 'email');
  } else if (fieldName.toLowerCase().includes('phone')) {
    return validateFieldValue(value, 'phone');
  } else if (fieldName.toLowerCase().includes('date')) {
    return validateFieldValue(value, 'date');
  } else if (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('total')) {
    return validateFieldValue(value, 'currency');
  }
  
  return { isValid: true, message: 'Format validation passed' };
}

/**
 * Validate field consistency with other fields
 */
function validateFieldConsistency(value: string, fieldName: string, memory: Readonly<AgentMemory>): { isValid: boolean; message: string } {
  // Check consistency with other extracted fields
  const existingFields = memory.extractedFields;
  
  // Example: Check if total matches sum of line items
  if (fieldName.toLowerCase().includes('total')) {
    const lineItems = Object.entries(existingFields)
      .filter(([key]) => key.toLowerCase().includes('item') || key.toLowerCase().includes('line'))
      .map(([, field]) => parseFloat(field.value) || 0);
    
    if (lineItems.length > 0) {
      const calculatedTotal = lineItems.reduce((sum, item) => sum + item, 0);
      const extractedTotal = parseFloat(value) || 0;
      const isConsistent = Math.abs(calculatedTotal - extractedTotal) < 0.01;
      
      return {
        isValid: isConsistent,
        message: isConsistent ? 'Total matches sum of line items' : 'Total does not match sum of line items',
      };
    }
  }
  
  return { isValid: true, message: 'Consistency validation passed' };
}

/**
 * Validate field completeness
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateFieldCompleteness(value: string, _fieldName: string): { isValid: boolean; message: string } {
  const isEmpty = !value || value.trim() === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined';
  return {
    isValid: !isEmpty,
    message: isEmpty ? 'Field is empty or missing' : 'Field is complete',
  };
}

/**
 * Validate field cross-reference
 */
function validateFieldCrossReference(value: string, fieldName: string, memory: Readonly<AgentMemory>): { isValid: boolean; message: string } {
  const existingFields = memory.extractedFields;
  const lowerFieldName = fieldName.toLowerCase();

  // Date Cross-References
  if (lowerFieldName.includes('date')) {
    const currentDate = new Date(value);
    if (isNaN(currentDate.getTime())) {
      return { isValid: false, message: 'Invalid date format' };
    }

    // Check Due Date vs Invoice Date
    if (lowerFieldName.includes('due')) {
      const invoiceDateField = Object.entries(existingFields).find(([key]) => key.toLowerCase().includes('invoice') && key.toLowerCase().includes('date'));
      if (invoiceDateField) {
        const invoiceDate = new Date(invoiceDateField[1].value);
        if (!isNaN(invoiceDate.getTime()) && currentDate < invoiceDate) {
          return { isValid: false, message: 'Due date cannot be before invoice date' };
        }
      }
    }
  }

  // Arithmetic Cross-References (Total vs Subtotal + Tax)
  if (lowerFieldName === 'total' || lowerFieldName === 'total_amount' || lowerFieldName === 'grand_total') {
    let subtotal = 0;
    let tax = 0;
    let foundComponents = false;

    for (const [key, field] of Object.entries(existingFields)) {
      const k = key.toLowerCase();
      if (k.includes('subtotal') || k.includes('net_amount')) {
        subtotal = parseFloat(field.value);
        foundComponents = true;
      }
      if (k.includes('tax') || k.includes('vat')) {
        tax = parseFloat(field.value);
        foundComponents = true;
      }
    }

    if (foundComponents) {
      const calculatedTotal = subtotal + tax;
      const extractedTotal = parseFloat(value);
      if (!isNaN(extractedTotal) && Math.abs(calculatedTotal - extractedTotal) > 0.05) { // 0.05 tolerance for rounding
         return { isValid: false, message: `Total (${extractedTotal}) does not match Subtotal + Tax (${calculatedTotal.toFixed(2)})` };
      }
    }
  }

  return { isValid: true, message: 'Cross-reference validation passed' };
}

/**
 * Validate business rules
 */
function validateBusinessRules(value: string, _fieldName: string, context?: string): { isValid: boolean; message: string } {
  if (!context) {
    return { isValid: true, message: 'No business rules provided' };
  }

  const rules = context.split(';').map(r => r.trim());
  
  for (const rule of rules) {
    const [ruleName, ruleValue] = rule.split(':').map(s => s.trim());
    
    switch (ruleName.toLowerCase()) {
      case 'min': {
        const minVal = parseFloat(ruleValue);
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal < minVal) {
          return { isValid: false, message: `Value must be at least ${minVal}` };
        }
        break;
      }
      case 'max': {
        const maxVal = parseFloat(ruleValue);
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal > maxVal) {
          return { isValid: false, message: `Value must be at most ${maxVal}` };
        }
        break;
      }
      case 'starts_with': {
        if (!value.startsWith(ruleValue)) {
          return { isValid: false, message: `Value must start with "${ruleValue}"` };
        }
        break;
      }
      case 'ends_with': {
        if (!value.endsWith(ruleValue)) {
          return { isValid: false, message: `Value must end with "${ruleValue}"` };
        }
        break;
      }
      case 'length': {
        const len = parseInt(ruleValue, 10);
        if (value.length !== len) {
          return { isValid: false, message: `Value must be exactly ${len} characters long` };
        }
        break;
      }
      case 'regex': {
        try {
          const regex = new RegExp(ruleValue);
          if (!regex.test(value)) {
            return { isValid: false, message: `Value does not match pattern ${ruleValue}` };
          }
        } catch (e) {
          logger.warn('Invalid regex in business rule definition:', ruleValue, e);
        }
        break;
      }
      case 'is_numeric': {
        if (isNaN(parseFloat(value))) {
           return { isValid: false, message: 'Value must be numeric' };
        }
        break;
      }
      case 'date_past': {
        const date = new Date(value);
        if (isNaN(date.getTime()) || date > new Date()) {
           return { isValid: false, message: 'Date must be in the past' };
        }
        break;
      }
      case 'no_future_date': {
        const date = new Date(value);
        // Allow today, but not future
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        
        if (isNaN(date.getTime()) || date >= tomorrow) {
           return { isValid: false, message: 'Date cannot be in the future' };
        }
        break;
      }
    }
  }

  return { isValid: true, message: 'Business rules validation passed' };
}

/**
 * Determine document complexity
 */
function determineComplexity(layoutAnalysis: Record<string, unknown>): 'low' | 'medium' | 'high' {
  // Simple heuristic - can be made more sophisticated
  const features = Array.isArray(layoutAnalysis?.features) ? layoutAnalysis.features : [];
  if (features.length > 10) return 'high';
  if (features.length > 5) return 'medium';
  return 'low';
}

/**
 * Extract special features from layout analysis
 */
function extractSpecialFeatures(layoutAnalysis: Record<string, unknown>): string[] {
  // Extract special features from layout analysis
  const features = layoutAnalysis?.specialFeatures;
  return Array.isArray(features) ? features : [];
}
