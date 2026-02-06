import { type Content } from '@google/genai';
import { logger } from './logger';
import {
  AgentLoopConfig,
  AgentMemory,
  AgentStep,
  ProgressCallback,
  AgentMemoryUpdate
} from './agentTypes';
import { AGENT_FUNCTIONS } from './agentTools';
import {
  executeAgentTurn,
  executeFunctionCall,
  createAgentSystemPrompt,
  createUserPrompt,
  createFollowUpPrompt
} from './agentGemini';

/**
 * Default agent configuration (Gemini 3)
 */
const DEFAULT_AGENT_CONFIG: AgentLoopConfig = {
  maxIterations: 5,
  confidenceThreshold: 0.8,
  temperature: 1.0, // Gemini 3 defaults to temperature 1.0
  maxTokens: 4096,
  model: 'gemini-3-flash-preview',
  enableThinking: true, // Always enabled for Gemini 3
};

/**
 * Create initial agent memory
 */
function createInitialMemory(sessionId: string, fileName: string): AgentMemory {
  return {
    sessionId,
    documentName: fileName,
    currentIteration: 0,
    extractedFields: {},
    processingHistory: [],
    documentAnalysis: {
      pageCount: 1,
      documentType: 'unknown',
      complexity: 'medium',
      specialFeatures: [],
    },
    confidence: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Apply updates to the agent memory
 */
export function applyMemoryUpdate(memory: AgentMemory, update?: AgentMemoryUpdate) {
  if (!update) return;

  if (update.extractedFields) {
    Object.assign(memory.extractedFields, update.extractedFields);
  }

  if (update.documentAnalysis) {
    Object.assign(memory.documentAnalysis, update.documentAnalysis);
  }

  if (typeof update.confidence === 'number') {
    memory.confidence = update.confidence;
  }

  if (typeof update.lastUpdated === 'number') {
    memory.lastUpdated = update.lastUpdated;
  }

  if (update.processingHistoryItem) {
    memory.processingHistory.push(update.processingHistoryItem);
  }
}

/**
 * Autonomous agent loop that processes documents iteratively.
 * Maintains conversation history across iterations and supports
 * multi-turn function calling within each iteration.
 */
export async function* agentLoop(
  file: File,
  fileData: string,
  config: Partial<AgentLoopConfig> = {},
  onProgress?: ProgressCallback
): AsyncGenerator<AgentStep, AgentMemory, unknown> {
  const agentConfig = { ...DEFAULT_AGENT_CONFIG, ...config };
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const memory = createInitialMemory(sessionId, file.name);

  let iteration = 0;
  let isComplete = false;

  try {
    // Initialize
    yield {
      type: 'thinking',
      content: 'Initializing autonomous document processing agent...',
      timestamp: Date.now(),
    };

    onProgress?.(10, 'Agent initialized');

    // Prepare file data for the initial content message
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid file data format');
    }

    const supportedImageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    const normalizedMimeType = supportedImageTypes.includes(file.type) ? file.type :
                               (file.type.startsWith('image/') ? 'image/jpeg' : file.type);

    const systemPrompt = createAgentSystemPrompt(memory.documentAnalysis.documentType);
    const initialUserPrompt = createUserPrompt(file.name, 1);

    // Build initial contents with the image (only sent once)
    const contents: Content[] = [{
      role: 'user',
      parts: [
        { text: initialUserPrompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: normalizedMimeType
          }
        }
      ]
    }];

    while (iteration < agentConfig.maxIterations && !isComplete) {
      iteration++;
      memory.currentIteration = iteration;

      yield {
        type: 'thinking',
        content: `Starting iteration ${iteration}/${agentConfig.maxIterations}`,
        timestamp: Date.now(),
      };

      onProgress?.(
        20 + (iteration - 1) * (60 / agentConfig.maxIterations),
        `Processing iteration ${iteration}`
      );

      try {
        // On iteration 2+, append a follow-up user message (no image re-send)
        if (iteration > 1) {
          contents.push({
            role: 'user',
            parts: [{ text: createFollowUpPrompt(iteration, memory.extractedFields) }]
          });
        }

        yield {
          type: 'thinking',
          content: `Analyzing document with Gemini AI (iteration ${iteration})...`,
          timestamp: Date.now(),
        };

        // Collect steps from the inner turn loop via callback
        const pendingSteps: AgentStep[] = [];
        const onStep = (step: AgentStep) => {
          pendingSteps.push(step);
        };

        // Execute multi-turn function calling
        const turnResult = await executeAgentTurn(
          systemPrompt,
          contents,
          AGENT_FUNCTIONS,
          fileData,
          file.type,
          memory,
          agentConfig,
          onStep
        );

        // Yield all steps produced during the turn
        for (const step of turnResult.steps) {
          yield step;
        }

        // Carry forward conversation history
        contents.length = 0;
        contents.push(...turnResult.updatedContents as Content[]);

        if (turnResult.finished) {
          isComplete = true;
          yield {
            type: 'result',
            content: 'Document processing completed successfully',
            timestamp: Date.now(),
          };
          break;
        }

        // Check if we should stop based on confidence
        if (memory.confidence >= agentConfig.confidenceThreshold) {
          yield {
            type: 'result',
            content: `Target confidence reached: ${(memory.confidence || 0).toFixed(2)}`,
            timestamp: Date.now(),
          };

          // Auto-finalize since confidence threshold reached
          try {
            const finalizeResult = await executeFunctionCall(
              {
                name: 'finalize_extraction',
                arguments: {
                  extracted_fields: memory.extractedFields,
                  overall_confidence: memory.confidence,
                  extraction_summary: `Successfully extracted ${Object.keys(memory.extractedFields).length} fields with ${(memory.confidence || 0).toFixed(2)} confidence`,
                  quality_score: memory.confidence,
                },
              },
              fileData,
              file.type,
              memory
            );

            applyMemoryUpdate(memory, finalizeResult.memoryUpdate);

            yield {
              type: 'result',
              content: 'Extraction finalized automatically',
              functionResult: finalizeResult,
              timestamp: Date.now(),
            };

            isComplete = true;
            break;
          } catch (finalizationError) {
            yield {
              type: 'error',
              content: 'Error during automatic finalization',
              timestamp: Date.now(),
            };
            logger.error('Finalization error:', finalizationError);
          }
        }

        // Update progress
        onProgress?.(
          20 + iteration * (60 / agentConfig.maxIterations),
          `Iteration ${iteration} completed`
        );

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Iteration failed';
        yield {
          type: 'error',
          content: `Error in iteration ${iteration}: ${errorMessage}`,
          timestamp: Date.now(),
        };

        // Continue to next iteration unless it's a critical error
        if (errorMessage.includes('API key') || errorMessage.includes('quota')) {
          break;
        }
      }

      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final status
    if (isComplete) {
      yield {
        type: 'result',
        content: `Processing completed after ${iteration} iterations with ${(memory.confidence || 0).toFixed(2)} confidence`,
        timestamp: Date.now(),
      };
      onProgress?.(100, 'Processing completed');
    } else if (iteration >= agentConfig.maxIterations) {
      yield {
        type: 'result',
        content: `Maximum iterations reached (${agentConfig.maxIterations}). Current confidence: ${(memory.confidence || 0).toFixed(2)}`,
        timestamp: Date.now(),
      };
      onProgress?.(100, 'Max iterations reached');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Agent processing failed';
    yield {
      type: 'error',
      content: `Agent processing failed: ${errorMessage}`,
      timestamp: Date.now(),
    };
    onProgress?.(100, 'Processing failed');
  }

  // Return final memory state
  return memory;
}
