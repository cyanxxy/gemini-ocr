import { GoogleGenAI, FunctionDeclaration, FunctionCallingConfigMode, type Content, type Part } from '@google/genai';
import { useSettingsStore } from '../store/useSettingsStore';
import { logger } from './logger';
import { applyThinkingConfig } from './gemini/client';
import type { GeminiModel } from './gemini/types';
import {
  AgentFunctionCall,
  AgentLoopConfig,
  AgentMemory,
  AgentStep,
  AgentFunctionResult,
  StepCallback,
  AgentTurnResult
} from './agentTypes';
import { applyMemoryUpdate } from './agentLoop';

// Type for Gemini API configuration
type GeminiApiConfig = {
  tools: Array<{
    functionDeclarations: Array<{
      name: string;
      description?: string;
      parametersJsonSchema?: Record<string, unknown>;
    }>;
  }>;
  toolConfig: {
    functionCallingConfig: {
      mode: FunctionCallingConfigMode;
    };
  };
} & Record<string, unknown>;

import {
  executeReOcrRegion,
  executeExtractField,
  executeValidateExtraction,
  executeAnalyzeDocumentStructure,
  executeFinalizeExtraction
} from './agentTools';

/**
 * Maximum number of inner rounds within a single turn to prevent infinite tool-calling loops
 */
const MAX_INNER_ROUNDS = 10;

/**
 * Execute a full agent turn with multi-turn function calling.
 *
 * This is the core of the agentic protocol: Gemini calls tools, we execute them
 * and send results back, allowing the model to chain tools intelligently rather
 * than firing all tools at once.
 */
export async function executeAgentTurn(
  systemPrompt: string,
  contents: Content[],
  functions: FunctionDeclaration[],
  fileData: string,
  mimeType: string,
  memory: AgentMemory,
  config: AgentLoopConfig,
  onStep: StepCallback
): Promise<AgentTurnResult> {
  const { apiKey } = useSettingsStore.getState();
  if (!apiKey) {
    throw new Error('Please set your API key in settings');
  }

  const genAI = new GoogleGenAI({ apiKey });
  const { thinkingConfig } = useSettingsStore.getState();
  const modelName = (config.model || 'gemini-3-flash-preview') as GeminiModel;

  // Build generation config
  let generationConfig: Record<string, unknown> = {
    temperature: 1.0,
    topP: 0.95,
    maxOutputTokens: config.maxTokens || 4096,
  };
  generationConfig = applyThinkingConfig(generationConfig, modelName, thinkingConfig);

  const apiConfig: GeminiApiConfig = {
    ...generationConfig,
    tools: [{
      functionDeclarations: functions.map(f => ({
        name: f.name,
        description: f.description,
        parametersJsonSchema: f.parametersJsonSchema
      }))
    }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO,
      }
    }
  };

  const workingContents = [...contents];
  const allSteps: AgentStep[] = [];

  for (let round = 0; round < MAX_INNER_ROUNDS; round++) {
    // Call the Gemini API
    const response = await genAI.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: workingContents,
      config: {
        ...apiConfig,
        systemInstruction: systemPrompt,
      }
    });

    // Append the model's response Content to conversation history
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      workingContents.push(modelContent);
    }

    // Yield thinking steps from text response
    const responseText = response.text || '';
    if (responseText) {
      const thinkingStep: AgentStep = {
        type: 'thinking',
        content: responseText,
        timestamp: Date.now(),
      };
      onStep(thinkingStep);
      allSteps.push(thinkingStep);
    }

    // Extract function calls
    const rawFunctionCalls = response.functionCalls || [];
    const functionCalls: AgentFunctionCall[] = [];

    for (const fc of rawFunctionCalls) {
      if (!fc.name || typeof fc.name !== 'string') {
        logger.warn('Skipping invalid function call - missing or invalid name:', fc);
        continue;
      }
      const rawArgs = fc.args || fc.arguments;
      const args: Record<string, unknown> = typeof rawArgs === 'object' && rawArgs !== null
        ? rawArgs as Record<string, unknown>
        : {};
      functionCalls.push({ name: fc.name, arguments: args });
    }

    // If no function calls, the model is done for this turn
    if (functionCalls.length === 0) {
      break;
    }

    // Execute each function call and build function response parts
    const functionResponseParts: Part[] = [];

    for (const fc of functionCalls) {
      const callStep: AgentStep = {
        type: 'function_call',
        content: `Executing: ${fc.name}`,
        functionCall: fc,
        timestamp: Date.now(),
      };
      onStep(callStep);
      allSteps.push(callStep);

      const result = await executeFunctionCall(fc, fileData, mimeType, memory);
      applyMemoryUpdate(memory, result.memoryUpdate);

      const resultStep: AgentStep = {
        type: 'result',
        content: `${fc.name} completed`,
        functionCall: fc,
        functionResult: result,
        timestamp: Date.now(),
      };
      onStep(resultStep);
      allSteps.push(resultStep);

      // Build FunctionResponse part for this call
      functionResponseParts.push({
        functionResponse: {
          name: fc.name,
          response: { output: result.data ?? { success: result.success, error: result.error } },
        }
      });

      // If finalize_extraction was called, we're done
      if (fc.name === 'finalize_extraction') {
        // Still need to add the function responses to history for completeness
        workingContents.push({ role: 'user', parts: functionResponseParts });
        return {
          updatedContents: workingContents,
          finished: true,
          steps: allSteps,
        };
      }
    }

    // Send all function results back to Gemini as a user turn with functionResponse parts
    workingContents.push({ role: 'user', parts: functionResponseParts });
    // Loop continues - model gets to react to results
  }

  return {
    updatedContents: workingContents,
    finished: false,
    steps: allSteps,
  };
}

/**
 * Execute a function call and return the result
 */
export async function executeFunctionCall(
  functionCall: AgentFunctionCall,
  fileData: string,
  mimeType: string,
  memory: Readonly<AgentMemory>
): Promise<AgentFunctionResult> {
  const { name, arguments: args } = functionCall;

  try {
    switch (name) {
      case 're_ocr_region':
        return await executeReOcrRegion(args, fileData, mimeType, memory);

      case 'extract_field':
        return await executeExtractField(args, fileData, mimeType, memory);

      case 'validate_extraction':
        return await executeValidateExtraction(args, fileData, mimeType, memory);

      case 'analyze_document_structure':
        return await executeAnalyzeDocumentStructure(args, fileData, mimeType, memory);

      case 'finalize_extraction':
        return await executeFinalizeExtraction(args, fileData, mimeType, memory);

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Function execution failed';
    const errorDetails = {
      functionName: name,
      arguments: args,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    };
    logger.error(`Error executing function ${name}:`, errorDetails);

    return {
      success: false,
      error: `${name} failed: ${errorMessage}`,
      data: { errorDetails },
    };
  }
}

/**
 * Create initial system prompt for the agent
 */
export function createAgentSystemPrompt(documentType?: string): string {
  return `You are a structured data extraction agent specialized in identifying and extracting specific fields from documents.

WORKFLOW:
1. **Analyze**: Call analyze_document_structure to understand document type and layout
2. **Extract**: Call extract_field for EACH piece of structured information you identify
3. **Validate**: Call validate_extraction to verify your extractions
4. **Refine**: If confidence < threshold, call re_ocr_region on unclear areas
5. **Finalize**: Call finalize_extraction when all key fields are extracted

IMPORTANT: Call ONE tool at a time. Wait for the result before deciding your next action.
Do NOT call multiple tools simultaneously - chain them sequentially based on results.

FIELD EXTRACTION RULES:
- Extract SPECIFIC FIELDS, not full document text
- Each field represents ONE piece of structured information (name, date, amount, etc.)
- Always provide the ACTUAL TEXT VALUE you see, not a description
- Include confidence score (0.0-1.0) based on text clarity

CORRECT EXAMPLES:
✓ extract_field(field_name="invoice_number", field_value="INV-2024-001", confidence=0.95)
✓ extract_field(field_name="total_amount", field_value="$1,234.56", confidence=0.90)
✓ extract_field(field_name="customer_name", field_value="Acme Corporation", confidence=0.92)
✓ extract_field(field_name="due_date", field_value="2024-03-15", confidence=0.88)

INCORRECT EXAMPLES:
✗ extract_field(field_name="invoice", field_value="I see an invoice number in the top right", confidence=0.8)
✗ extract_field(field_name="document", field_value="This is a financial document", confidence=0.9)
✗ extract_field(field_name="text", field_value="There is text on the page", confidence=0.7)

DOCUMENT-SPECIFIC FIELDS:
- **Invoices**: invoice_number, invoice_date, due_date, vendor_name, customer_name, line_items, subtotal, tax, total_amount
- **Resumes**: candidate_name, email, phone, address, work_experience, education, skills, certifications
- **Forms**: All labeled fields and their corresponding values
- **Receipts**: merchant_name, date, items, amounts, total, payment_method
- **Contracts**: parties, effective_date, terms, signatures, clauses

CONFIDENCE SCORING:
- 0.95-1.0: Printed text, clear and unambiguous
- 0.85-0.94: Slightly degraded but readable
- 0.70-0.84: Handwritten or low quality, but interpretable
- Below 0.70: Consider using re_ocr_region to improve

${documentType ? `Document Type: ${documentType}` : 'Document Type: Unknown - analyze first'}

Remember: You are extracting structured data fields, not performing full OCR. Focus on identifying and extracting key information fields.`;
}

/**
 * Create user prompt for the initial document processing (iteration 1)
 */
export function createUserPrompt(
  fileName: string,
  iteration: number,
  previousResults?: Record<string, unknown>
): string {
  let prompt = `Process this document: ${fileName}

This is iteration ${iteration} of the autonomous extraction process.`;

  if (previousResults && Object.keys(previousResults).length > 0) {
    prompt += `\n\nPrevious extraction results:
${JSON.stringify(previousResults, null, 2)}

Analyze these results and determine if improvement is needed. Focus on fields with low confidence or missing information.`;
  }

  prompt += `\n\nBegin processing now.`;

  return prompt;
}

/**
 * Create a follow-up prompt for iterations 2+ (no image re-send needed)
 */
export function createFollowUpPrompt(
  iteration: number,
  extractedFields: Record<string, { value: string; confidence: number }>
): string {
  const fieldCount = Object.keys(extractedFields).length;
  const fieldSummary = Object.entries(extractedFields)
    .map(([name, field]) => `  - ${name}: "${field.value}" (confidence: ${field.confidence.toFixed(2)})`)
    .join('\n');

  return `This is iteration ${iteration}. Review your previous extractions and improve:

Extracted ${fieldCount} fields so far:
${fieldSummary || '  (none)'}

Focus on:
- Fields with confidence below 0.85 that need re-extraction
- Missing fields that should be present for this document type
- Validation of extracted values against each other

Continue extraction or call finalize_extraction if all fields are complete.`;
}
