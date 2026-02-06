/**
 * Types and interfaces for the agentic OCR system
 */

// Note: FunctionCallingConfigMode is imported from @google/genai SDK
// Use FunctionCallingConfigMode.AUTO, FunctionCallingConfigMode.ANY, FunctionCallingConfigMode.NONE

/**
 * Represents a function call made by the agent
 */
export interface AgentFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Represents the result of a function call
 */
export interface AgentMemoryUpdate {
  extractedFields?: Record<string, AgentMemory['extractedFields'][string]>;
  documentAnalysis?: Partial<AgentMemory['documentAnalysis']>;
  confidence?: number;
  lastUpdated?: number;
  processingHistoryItem?: AgentStep;
}

export interface AgentFunctionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  memoryUpdate?: AgentMemoryUpdate;
}

/**
 * Represents a step in the agent's reasoning process
 */
export interface AgentStep {
  type: 'thinking' | 'function_call' | 'result' | 'error';
  content: string;
  functionCall?: AgentFunctionCall;
  functionResult?: AgentFunctionResult;
  timestamp: number;
}

/**
 * Represents the agent's response to a prompt
 */
export interface AgentResponse {
  content: string;
  functionCalls?: AgentFunctionCall[];
  steps: AgentStep[];
  finished: boolean;
}

/**
 * Configuration for the agent's behavior (used by agent loop)
 */
export interface AgentLoopConfig {
  maxIterations: number;
  confidenceThreshold: number;
  temperature: number;
  maxTokens: number;
  model: string;
  enableThinking?: boolean;
}

/**
 * Represents the agent's memory/context
 */
export interface AgentMemory {
  sessionId: string;
  documentName: string;
  currentIteration: number;
  extractedFields: Record<string, {
    value: string;
    confidence: number;
    validation_rule?: string;
    location?: string;
    isValid?: boolean;
    validationMessage?: string;
    extractedAt?: number;
  }>;
  processingHistory: AgentStep[];
  documentAnalysis: {
    pageCount: number;
    documentType: string;
    complexity: 'low' | 'medium' | 'high';
    specialFeatures: string[];
  };
  confidence: number;
  lastUpdated: number;
}

/**
 * Type for progress update callbacks
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Callback to yield steps from inside executeAgentTurn without async generators
 */
export type StepCallback = (step: AgentStep) => void;

/**
 * Result from a single agent turn (may involve multiple API calls for tool chaining)
 */
export interface AgentTurnResult {
  /** Conversation history to carry forward (includes all model/tool exchanges) */
  updatedContents: Array<{ role?: string; parts?: unknown[] }>;
  /** True if finalize_extraction was called during this turn */
  finished: boolean;
  /** All steps produced during this turn */
  steps: AgentStep[];
}