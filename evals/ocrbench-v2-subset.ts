import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { GoogleGenAI } from '@google/genai';

type SupportedTaskType =
  | 'key information extraction en'
  | 'document parsing en'
  | 'full-page OCR en';

interface OcrBenchRow {
  id: number;
  dataset_name: string;
  question: string;
  type: string;
  answers: string[];
  image: {
    src: string;
    height: number;
    width: number;
  };
}

interface OcrBenchRowWrapper {
  row: OcrBenchRow;
}

interface OcrBenchRowsResponse {
  rows: OcrBenchRowWrapper[];
  num_rows_total?: number;
}

interface PredictionRecord {
  id: number;
  dataset_name: string;
  question: string;
  type: string;
  answers: string[];
  image_path: string;
  predict: string;
  latencyMs?: number;
  promptTokenCount?: number;
  candidateTokenCount?: number;
  totalTokenCount?: number;
  error?: string;
}

interface SubsetManifest {
  createdAt: string;
  model: string;
  totalSelected: number;
  selectionPlan: Record<SupportedTaskType, number>;
  cases: Array<{
    id: number;
    dataset_name: string;
    question: string;
    type: SupportedTaskType;
    image_path: string;
    answers: string[];
  }>;
}

const DATASET_FILTER_URL =
  'https://datasets-server.huggingface.co/filter?dataset=ling99/OCRBench_v2&config=default&split=test&where={where}&offset={offset}&length={length}';

const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 150;
const RETRY_LIMIT = 6;
const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'reports',
  'ocrbench-v2-subset',
);

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
const API_KEY = process.env.GEMINI_API_KEY;

const SELECTION_PLAN: Record<SupportedTaskType, number> = {
  'key information extraction en': 80,
  'document parsing en': 60,
  'full-page OCR en': 60,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(url: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error('HTTP 429');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const delay = Math.min(1_000 * 2 ** attempt, 12_000);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchBufferWithRetry(url: string): Promise<Uint8Array> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error('HTTP 429');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      const delay = Math.min(1_000 * 2 ** attempt, 12_000);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function roundRobinSelect(rows: OcrBenchRow[], targetCount: number): OcrBenchRow[] {
  const byDataset = new Map<string, OcrBenchRow[]>();
  for (const row of rows) {
    const existing = byDataset.get(row.dataset_name);
    if (existing) {
      existing.push(row);
    } else {
      byDataset.set(row.dataset_name, [row]);
    }
  }

  const datasetNames = [...byDataset.keys()].sort((a, b) => a.localeCompare(b));
  const selected: OcrBenchRow[] = [];

  while (selected.length < targetCount) {
    let pickedAny = false;

    for (const datasetName of datasetNames) {
      const bucket = byDataset.get(datasetName);
      if (!bucket || bucket.length === 0) {
        continue;
      }

      selected.push(bucket.shift()!);
      pickedAny = true;

      if (selected.length >= targetCount) {
        break;
      }
    }

    if (!pickedAny) {
      break;
    }
  }

  return selected;
}

function getMimeTypeFromUrl(imageUrl: string): string {
  const normalized = imageUrl.toLowerCase();
  if (normalized.includes('.png')) {
    return 'image/png';
  }
  if (normalized.includes('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function scanRelevantRows() {
  const collected = new Map<SupportedTaskType, OcrBenchRow[]>();
  for (const taskType of Object.keys(SELECTION_PLAN) as SupportedTaskType[]) {
    collected.set(taskType, []);

    const where = encodeURIComponent(`"type"='${taskType}'`);
    const initialUrl = DATASET_FILTER_URL
      .replace('{where}', where)
      .replace('{offset}', '0')
      .replace('{length}', String(PAGE_SIZE));
    const initialPage = await fetchJsonWithRetry<OcrBenchRowsResponse>(initialUrl);
    const totalRows = initialPage.num_rows_total ?? initialPage.rows.length;

    for (const wrapped of initialPage.rows) {
      const row = wrapped.row;
      collected.get(taskType)!.push({
        id: row.id,
        dataset_name: row.dataset_name,
        question: row.question,
        type: row.type,
        answers: row.answers,
        image: row.image,
      });
    }

    await sleep(REQUEST_DELAY_MS);

    for (let offset = PAGE_SIZE; offset < totalRows; offset += PAGE_SIZE) {
      const url = DATASET_FILTER_URL
        .replace('{where}', where)
        .replace('{offset}', String(offset))
        .replace('{length}', String(PAGE_SIZE));
      const page = await fetchJsonWithRetry<OcrBenchRowsResponse>(url);

      for (const wrapped of page.rows) {
        const row = wrapped.row;
        collected.get(taskType)!.push({
          id: row.id,
          dataset_name: row.dataset_name,
          question: row.question,
          type: row.type,
          answers: row.answers,
          image: row.image,
        });
      }

      await sleep(REQUEST_DELAY_MS);
    }
  }

  return collected;
}

async function buildSubsetManifest(): Promise<SubsetManifest> {
  const scanned = await scanRelevantRows();
  const selectedCases: OcrBenchRow[] = [];

  for (const taskType of Object.keys(SELECTION_PLAN) as SupportedTaskType[]) {
    const rows = scanned.get(taskType) ?? [];
    const chosen = roundRobinSelect(rows, SELECTION_PLAN[taskType]);

    if (chosen.length < SELECTION_PLAN[taskType]) {
      throw new Error(
        `Only found ${chosen.length} rows for ${taskType}, expected ${SELECTION_PLAN[taskType]}.`,
      );
    }

    selectedCases.push(...chosen);
  }

  selectedCases.sort((a, b) => a.id - b.id);

  return {
    createdAt: new Date().toISOString(),
    model: MODEL,
    totalSelected: selectedCases.length,
    selectionPlan: SELECTION_PLAN,
    cases: selectedCases.map((row) => ({
      id: row.id,
      dataset_name: row.dataset_name,
      question: row.question,
      type: row.type as SupportedTaskType,
      image_path: row.image.src,
      answers: row.answers,
    })),
  };
}

async function loadOrCreateManifest(manifestPath: string) {
  try {
    const existing = await readFile(manifestPath, 'utf8');
    return JSON.parse(existing) as SubsetManifest;
  } catch {
    const manifest = await buildSubsetManifest();
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return manifest;
  }
}

async function loadExistingPredictions(predictionsPath: string) {
  try {
    const existing = await readFile(predictionsPath, 'utf8');
    return JSON.parse(existing) as PredictionRecord[];
  } catch {
    return [];
  }
}

async function main() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is required.');
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const manifestPath = path.resolve(OUTPUT_DIR, 'subset-manifest.json');
  const predictionsPath = path.resolve(OUTPUT_DIR, 'predictions-input.json');
  const metricsPath = path.resolve(OUTPUT_DIR, 'run-metrics.json');

  const manifest = await loadOrCreateManifest(manifestPath);
  const existingPredictions = await loadExistingPredictions(predictionsPath);
  const completed = new Map(existingPredictions.map((record) => [record.id, record]));
  const predictions = [...existingPredictions];

  const pending = manifest.cases.filter((item) => !completed.has(item.id));

  console.log(
    JSON.stringify({
      model: MODEL,
      totalSelected: manifest.totalSelected,
      completed: completed.size,
      pending: pending.length,
      outputDir: OUTPUT_DIR,
    }),
  );

  for (const item of pending) {
    const benchmarkRow = {
      id: item.id,
      dataset_name: item.dataset_name,
      question: item.question,
      type: item.type,
      answers: item.answers,
      image: {
        src: item.image_path,
        height: 0,
        width: 0,
      },
    };

    const imageBytes = await fetchBufferWithRetry(item.image_path);
    const base64 = Buffer.from(imageBytes).toString('base64');
    const mimeType = getMimeTypeFromUrl(item.image_path);

    const startedAt = Date.now();

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
              {
                text: item.question,
              },
            ],
          },
        ],
        config: {
          temperature: 1,
          maxOutputTokens: 4096,
          thinkingConfig: {
            thinkingLevel: 'LOW',
          },
        },
      });

      const record: PredictionRecord = {
        id: benchmarkRow.id,
        dataset_name: benchmarkRow.dataset_name,
        question: benchmarkRow.question,
        type: benchmarkRow.type,
        answers: benchmarkRow.answers,
        image_path: benchmarkRow.image.src,
        predict: response.text?.trim() || '',
        latencyMs: Date.now() - startedAt,
        promptTokenCount: response.usageMetadata?.promptTokenCount,
        candidateTokenCount: response.usageMetadata?.candidatesTokenCount,
        totalTokenCount: response.usageMetadata?.totalTokenCount,
      };

      predictions.push(record);
      completed.set(record.id, record);
      await writeFile(predictionsPath, `${JSON.stringify(predictions, null, 2)}\n`, 'utf8');
      console.log(`completed ${record.id} ${record.type} ${record.dataset_name}`);
    } catch (error) {
      const record: PredictionRecord = {
        id: benchmarkRow.id,
        dataset_name: benchmarkRow.dataset_name,
        question: benchmarkRow.question,
        type: benchmarkRow.type,
        answers: benchmarkRow.answers,
        image_path: benchmarkRow.image.src,
        predict: '',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };

      predictions.push(record);
      completed.set(record.id, record);
      await writeFile(predictionsPath, `${JSON.stringify(predictions, null, 2)}\n`, 'utf8');
      console.error(`failed ${record.id} ${record.type} ${record.dataset_name}: ${record.error}`);
    }

    await sleep(250);
  }

  const aggregate = predictions.reduce(
    (acc, record) => {
      if (record.latencyMs != null) {
        acc.totalLatencyMs += record.latencyMs;
      }
      if (record.promptTokenCount != null) {
        acc.promptTokens += record.promptTokenCount;
      }
      if (record.candidateTokenCount != null) {
        acc.candidateTokens += record.candidateTokenCount;
      }
      if (record.totalTokenCount != null) {
        acc.totalTokens += record.totalTokenCount;
      }
      if (record.error) {
        acc.failures += 1;
      }
      return acc;
    },
    {
      totalCases: predictions.length,
      failures: 0,
      totalLatencyMs: 0,
      promptTokens: 0,
      candidateTokens: 0,
      totalTokens: 0,
    },
  );

  await writeFile(
    metricsPath,
    `${JSON.stringify(
      {
        ...aggregate,
        averageLatencyMs: aggregate.totalCases > 0 ? aggregate.totalLatencyMs / aggregate.totalCases : 0,
        averageTotalTokens: aggregate.totalCases > 0 ? aggregate.totalTokens / aggregate.totalCases : 0,
        model: MODEL,
        completedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
