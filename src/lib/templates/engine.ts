import { GoogleGenAI } from '@google/genai';
import { applyThinkingConfig } from '../gemini/client';
import { getTopKForModel, parseJsonPayload } from '../gemini/structured';
import { logger } from '../logger';
import type {
  ExtractionPreset,
  GeminiClientConfig,
  PresetExtractedField,
  PresetRunResult,
  PresetStreamingCallbacks,
  PresetStructuredOutput,
} from '../gemini/types';

interface TemplateGenerationOptions {
  abortSignal?: AbortSignal;
}

type PrimitiveFieldValue = string | number | boolean | string[] | null;

interface RawPresetField {
  value?: unknown;
  confidence?: unknown;
}

interface RawPresetPayload {
  documentType?: unknown;
  summary?: unknown;
  fields?: Record<string, RawPresetField | PrimitiveFieldValue>;
  rows?: unknown;
  warnings?: unknown;
}

const JSON_ONLY_INSTRUCTION = [
  'Return valid JSON only.',
  'Do not wrap the JSON in markdown fences.',
  'Do not invent fields that are not visible in the document.',
  'Use null for missing scalar values and [] for missing list values.',
  'Confidence scores must be numbers between 0 and 1.',
].join(' ');

function parsePresetPayload(rawText: string): RawPresetPayload {
  return parseJsonPayload<RawPresetPayload>(rawText, 'Preset extraction');
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function normalizeFieldValue(value: unknown, type: PresetExtractedField['type']): PrimitiveFieldValue {
  if (value == null) {
    return type === 'list' ? [] : null;
  }

  if (type === 'list') {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    return String(value)
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === 'no') return false;
    return String(value).trim();
  }

  if (type === 'number') {
    if (typeof value === 'number') {
      return value;
    }
    const numeric = Number(String(value).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(numeric) ? numeric : String(value).trim();
  }

  if (type === 'currency') {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    const trimmed = String(value).trim();
    const numeric = Number(trimmed.replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(numeric) && /[0-9]/.test(trimmed)
      ? numeric.toFixed(2)
      : trimmed;
  }

  return String(value).trim();
}

function normalizeRows(rows: unknown): Array<Record<string, string>> | undefined {
  if (!Array.isArray(rows)) {
    return undefined;
  }

  const normalized = rows
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
    .map((entry) => Object.fromEntries(
      Object.entries(entry).map(([key, value]) => [key, value == null ? '' : String(value).trim()])
    ))
    .filter((entry) => Object.values(entry).some(Boolean));

  return normalized.length > 0 ? normalized : undefined;
}

function normalizePresetPayload(
  rawPayload: RawPresetPayload,
  preset: ExtractionPreset,
): PresetStructuredOutput {
  const fields = Object.fromEntries(
    preset.rules.map((rule) => {
      const rawField = rawPayload.fields?.[rule.field];
      const rawValue = typeof rawField === 'object' && rawField !== null && !Array.isArray(rawField)
        ? rawField.value
        : rawField;
      const rawConfidence = typeof rawField === 'object' && rawField !== null && !Array.isArray(rawField)
        ? rawField.confidence
        : undefined;

      const normalizedField: PresetExtractedField = {
        type: rule.type,
        value: normalizeFieldValue(rawValue, rule.type),
        confidence: clampConfidence(rawConfidence),
        required: Boolean(rule.required),
      };

      return [rule.field, normalizedField];
    }),
  );

  return {
    presetId: preset.id,
    documentType: typeof rawPayload.documentType === 'string' && rawPayload.documentType.trim()
      ? rawPayload.documentType.trim()
      : preset.label,
    summary: typeof rawPayload.summary === 'string' && rawPayload.summary.trim()
      ? rawPayload.summary.trim()
      : `Structured extraction for ${preset.label.toLowerCase()}.`,
    fields,
    rows: normalizeRows(rawPayload.rows),
    warnings: Array.isArray(rawPayload.warnings)
      ? rawPayload.warnings.map((warning) => String(warning).trim()).filter(Boolean)
      : undefined,
  };
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function fieldValueToString(value: PrimitiveFieldValue): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value == null) {
    return 'Not found';
  }
  return String(value);
}

export function buildPresetMarkdown(result: PresetStructuredOutput, preset: ExtractionPreset): string {
  const sections: string[] = [
    `# ${preset.label} Extraction`,
    '',
    result.summary,
    '',
    '## Fields',
    '',
    '| Field | Value | Confidence |',
    '| --- | --- | --- |',
  ];

  for (const rule of preset.rules) {
    const field = result.fields[rule.field];
    sections.push(
      `| ${escapeMarkdown(rule.field)} | ${escapeMarkdown(fieldValueToString(field?.value ?? null))} | ${Math.round((field?.confidence ?? 0) * 100)}% |`,
    );
  }

  if (result.rows && result.rows.length > 0) {
    const columns = preset.tableColumns && preset.tableColumns.length > 0
      ? preset.tableColumns
      : Object.keys(result.rows[0]);

    sections.push('', '## Rows', '', `| ${columns.map(escapeMarkdown).join(' | ')} |`, `| ${columns.map(() => '---').join(' | ')} |`);

    for (const row of result.rows) {
      sections.push(`| ${columns.map((column) => escapeMarkdown(row[column] ?? '')).join(' | ')} |`);
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    sections.push('', '## Warnings', '', ...result.warnings.map((warning) => `- ${warning}`));
  }

  return sections.join('\n');
}

export function buildPresetCsv(result: PresetStructuredOutput, preset: ExtractionPreset): string | undefined {
  if (preset.outputShape !== 'table' || !result.rows || result.rows.length === 0) {
    return undefined;
  }

  const columns = preset.tableColumns && preset.tableColumns.length > 0
    ? preset.tableColumns
    : Object.keys(result.rows[0]);

  const escapeCsv = (value: string) => {
    const normalized = value.replace(/"/g, '""');
    return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
  };

  return [
    columns.join(','),
    ...result.rows.map((row) => columns.map((column) => escapeCsv(row[column] ?? '')).join(',')),
  ].join('\n');
}

export function buildPresetPrompt(preset: ExtractionPreset): string {
  const rulesText = preset.rules
    .map((rule) => `- ${rule.field} (${rule.type}${rule.required ? ', required' : ''}): ${rule.description}${rule.example ? ` Example: ${rule.example}.` : ''}`)
    .join('\n');

  const rowInstructions = preset.outputShape === 'table'
    ? `Also extract line-item rows into a "rows" array. Use these columns when present: ${(preset.tableColumns || []).join(', ')}.`
    : 'Do not include a "rows" array unless the preset requires one.';

  return [
    `You are extracting structured data for the preset "${preset.label}".`,
    preset.description,
    JSON_ONLY_INSTRUCTION,
    'Return this JSON shape:',
    '{"documentType":"string","summary":"string","fields":{"field_name":{"value":"string | number | boolean | string[] | null","confidence":0.0}},"rows":[{"column":"value"}],"warnings":["string"]}',
    'Rules:',
    rulesText,
    rowInstructions,
    'Keep the original language for extracted text whenever possible.',
  ].join('\n\n');
}

export async function runExtractionPreset(
  fileData: string,
  mimeType: string,
  clientConfig: GeminiClientConfig,
  preset: ExtractionPreset,
  options?: TemplateGenerationOptions,
  callbacks?: PresetStreamingCallbacks,
): Promise<PresetRunResult> {
  try {
    const { apiKey, model, thinkingConfig } = clientConfig;

    if (!apiKey) {
      throw new Error('Please configure your Gemini API key in settings');
    }

    if (options?.abortSignal?.aborted) {
      throw new Error('Extraction cancelled');
    }

    const genAI = new GoogleGenAI({ apiKey });
    const base64Data = fileData.split(',')[1] || fileData;

    let generationConfig: Record<string, unknown> = {
      temperature: 0.2,
      maxOutputTokens: 8192,
      topP: 0.9,
      topK: getTopKForModel(model),
      responseMimeType: 'application/json',
    };

    if (options?.abortSignal) {
      generationConfig.abortSignal = options.abortSignal;
    }

    generationConfig = applyThinkingConfig(generationConfig, model, thinkingConfig);

    const contents = [{
      role: 'user' as const,
      parts: [
        { text: buildPresetPrompt(preset) },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ],
    }];

    let rawText = '';

    if (callbacks) {
      const stream = await genAI.models.generateContentStream({
        model,
        contents,
        config: generationConfig,
      });

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        rawText += chunkText;
        callbacks.onProgress?.(chunkText);
      }
    } else {
      const response = await genAI.models.generateContent({
        model,
        contents,
        config: generationConfig,
      });
      rawText = response.text || '';
    }

    const parsedPayload = parsePresetPayload(rawText);
    const normalized = normalizePresetPayload(parsedPayload, preset);
    const result: PresetRunResult = {
      presetId: preset.id,
      markdown: buildPresetMarkdown(normalized, preset),
      json: normalized,
      csv: buildPresetCsv(normalized, preset),
    };

    callbacks?.onComplete?.(result);
    return result;
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    callbacks?.onError?.(normalizedError);
    logger.error(`Preset extraction failed for ${preset.id}:`, normalizedError);
    throw normalizedError;
  }
}
