# 2026 Agentic OCR And Evals Expansion Plan

## Objective

Push this repo beyond "OCR app with Gemini" and turn it into an open, eval-driven document extraction system with a credible agentic OCR story.

We want to do all of the following:

- add provenance-aware extraction and evals
- add DocVQA-style reasoning evals
- split agentic quality from extraction quality
- expand robustness slices for harder documents
- add agent/tool ablations
- publish a public leaderboard and richer reports

## Why This Matters In 2026

The OCR and document-understanding landscape moved fast in 2025-2026:

- `OCRBench v2` expanded OCR evaluation into broader layout, handwriting, and reasoning-heavy scenarios.
- `OmniDocBench` raised the bar from plain text extraction to full document parsing, layout, formulas, tables, and reading order.
- `olmOCR-Bench` emphasized robustness on ugly real-world documents such as old scans, multi-column text, headers, footers, tiny text, and tables.
- `DocVQA 2026` formalized broader document question answering across multiple domains.
- `OCR-Agent` validated that agentic OCR can outperform strong baselines when the system is structured well.
- `BFCL v4`, `tau2-bench`, and `StableToolBench` showed that agent systems now need separate tool-use evaluation, not just task outcome checks.

This means a generic OCR product pitch is not enough. The opportunity is stronger if the repo becomes:

- an open benchmarked extraction system
- a grounded agentic OCR reference implementation
- a public eval suite with reproducible failure analysis

## North Star

Position the repo as:

> Open Gemini OCR is an eval-driven document extraction system for OCR, structured extraction, and agentic recovery, with public reports and grounded failure analysis.

## Selected Benchmark Set

We will anchor the next expansion around exactly 3 external benchmarks/eval families:

1. `OCRBench v2`
2. `OmniDocBench`
3. `DocVQA 2026`

This is the smallest set that still covers the repo's real product surface:

- `OCRBench v2` for OCR robustness, localization, and reasoning-heavy text understanding
- `OmniDocBench` for document parsing, tables, layout, and PDF structure
- `DocVQA 2026` for question answering and multi-domain document reasoning

We are intentionally **not** adopting more external benchmark families right now.

### Why These 3

#### OCRBench v2

Best fit for:

- simple OCR quality
- difficult OCR scenarios
- text-centric reasoning pressure
- tracking whether agentic recovery actually improves hard OCR cases

Why it stays:

- it is one of the strongest OCR-centric references in the 2025-2026 landscape
- `OCR-Agent` reports directly against it, which makes it especially relevant for our agentic direction

#### OmniDocBench

Best fit for:

- templates
- structured extraction
- table-heavy documents
- layout-aware parsing
- full document understanding beyond plain markdown OCR

Why it stays:

- it is the most relevant document-parsing benchmark for where this repo is heading
- it aligns with invoices, receipts, business documents, tables, and page structure

#### DocVQA 2026

Best fit for:

- document QA
- reasoning over extracted content
- multi-domain document understanding
- future `docvqa` mode in this repo

Why it stays:

- it gives us a clean benchmark target for the reasoning layer, not just extraction
- it helps prevent the repo from being trapped in "OCR only" positioning

### What We Are Not Selecting

#### olmOCR-Bench

Useful, but overlapping enough with OCRBench v2 and OmniDocBench that it would spread the project too wide right now. We can still borrow fixture ideas from it without adopting it as a primary benchmark target.

#### BFCL v4, tau2-bench, StableToolBench

Useful for generic tool-agent evaluation, but they are not document-first benchmarks. We should borrow their ideas for internal agent scoreboards rather than treat them as the repo's public benchmark anchors.

## Strategic Direction

### 1. Provenance-Aware Extraction

Current output correctness is useful, but not enough. We should capture where extracted values came from.

Add support for:

- source page number
- source region identifier
- normalized bounding box
- source snippet or local text span
- extraction path such as `batch_extract` vs `re_ocr_region`

Why:

- stronger trust for users
- better debugging for failures
- better alignment with document-parsing benchmarks
- lets us score grounding, not just final value correctness

Deliverables:

- extend extraction output types with optional provenance metadata
- store provenance for `template` and `agentic` runs
- include provenance in markdown/JSON artifacts where available
- add provenance-focused eval assertions

Candidate type additions:

```ts
interface FieldProvenance {
  page?: number;
  regionId?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  snippet?: string;
  extractionPath?: 'batch_extract' | 're_ocr_region' | 'simple_ocr';
}

interface ProvenancedField extends PresetExtractedField {
  provenance?: FieldProvenance;
}
```

Repo impact:

- `src/lib/gemini/types.ts`
- `src/lib/templates/engine.ts`
- `src/lib/agentTools.ts`
- `src/lib/agentLoop.ts`
- `src/store/useTemplateOcrStore.ts`
- `src/store/useAgenticOcrStore.ts`
- `src/lib/evals.ts`

Acceptance criteria:

- at least invoice, receipt, resume, and business-card outputs can emit provenance
- agentic recovery writes provenance for recovered fields
- evals can fail on missing provenance independently of value correctness

### 2. DocVQA-Style Reasoning Evals

We should add a second family of evals that asks questions about full documents, not just field extraction.

Target tasks:

- multi-page summary questions
- table lookup questions
- comparison questions
- cross-section reasoning
- figure or chart caption questions when text context exists
- business-report and slide-deck questions

Examples:

- "What is the total amount due?"
- "Which department had the highest quarterly spend?"
- "What city is listed in the sender address?"
- "How many support hours were billed?"

Deliverables:

- add a new eval mode such as `docvqa`
- create QA fixtures with expected answers and aliases
- support exact-match plus normalized-match scoring
- add document families beyond receipts and invoices

Suggested corpus expansion:

- annual report page
- slide deck page
- infographic
- engineering diagram with labels
- policy memo
- comic or poster page for OCR + layout reasoning stress

Repo impact:

- `src/lib/evals.ts`
- `evals/shared.ts`
- `evals/run.ts`
- `evals/cases/`
- `evals/corpus/`

Acceptance criteria:

- repo contains at least 12 DocVQA-style cases across 4 document families
- reports show document QA pass rate separately from extraction pass rate

### 3. Split Extraction Quality From Agent Quality

Right now an agentic case mainly passes or fails on output quality. That is incomplete.

We should score:

- extraction quality
- agent behavior quality

Agent behavior metrics should include:

- number of tool calls
- number of recovery calls
- duplicate or unnecessary tool calls
- early-stop failures
- final required-field coverage
- retries after tool errors
- stop reason
- cost proxy such as token usage or step count

Deliverables:

- structured agent trace events
- per-run telemetry in eval reports
- agent-specific assertions and scorecards

Candidate trace type:

```ts
interface AgentTraceEvent {
  type: 'tool_call' | 'tool_result' | 'decision' | 'stop' | 'validation';
  toolName?: string;
  fieldIds?: string[];
  success?: boolean;
  reason?: string;
  iteration: number;
  timestamp: string;
}
```

Suggested assertions:

- `tool_calls_max`
- `tool_calls_min`
- `recovery_calls_max`
- `required_fields_coverage_min`
- `stop_reason_equals`
- `duplicate_tool_calls_max`
- `agent_iterations_max`

Repo impact:

- `src/lib/agentLoop.ts`
- `src/lib/agentTools.ts`
- `src/lib/evals.ts`
- `evals/run.ts`
- `evals/reports/latest.json`
- `evals/reports/latest.md`

Acceptance criteria:

- every agentic eval case produces a machine-readable trace summary
- reports show both extraction score and agent score
- regressions can fail on inefficient behavior even when output is correct

### 4. Robustness Slices For Hard Documents

We need harder, explicitly tagged slices modeled after the best 2025-2026 public suites.

Target slices:

- handwriting
- rotated or skewed pages
- low-resolution scans
- tiny text
- multi-column layouts
- tables with merged cells
- headers and footers
- dense financial pages
- forms
- noisy scans and fax-like artifacts

Deliverables:

- expand `evals/corpus/` with sanitized or fully owned fixtures
- tag every case with one or more robustness slices
- add slice-level summary tables to reports

Suggested reporting:

- overall pass rate
- pass rate by mode
- pass rate by document family
- pass rate by robustness slice

Repo impact:

- `evals/corpus/`
- `evals/cases/`
- `evals/render-report.ts`

Acceptance criteria:

- at least 25 total eval cases
- every case tagged by document family and difficulty slice
- report includes slice-by-slice breakdown

### 5. Agent And Tooling Ablations

The repo will become more credible if it shows what actually helps.

We should run controlled ablations for:

- `extract_fields_batch` on vs off
- `re_ocr_region` direct structured recovery on vs older text-only recovery
- confidence threshold variants
- max-iteration variants
- reflection/validation strictness variants
- stop-policy variants
- memory write-back strictness

Deliverables:

- support matrix in the eval runner for named experiment profiles
- checked-in report comparing baseline vs ablations
- markdown summary of what improved and what regressed

Suggested config shape:

```ts
interface EvalExperimentProfile {
  id: string;
  label: string;
  modeOverrides?: Record<string, unknown>;
  agentOverrides?: {
    maxIterations?: number;
    confidenceThreshold?: number;
    allowRecovery?: boolean;
  };
}
```

Repo impact:

- `evals/config.json`
- `evals/run.ts`
- `evals/render-report.ts`
- `src/lib/agentLoop.ts`

Acceptance criteria:

- nightly/manual evals can run a baseline profile and at least 2 ablation profiles
- report clearly shows whether an architecture change helped or hurt

### 6. Public Leaderboard And Rich Reports

The repo needs a stronger public proof layer.

Deliverables:

- checked-in leaderboard page or report section
- scorecards for `simple`, `template`, `agentic`, and future `docvqa`
- trend snapshot across recent runs
- top failures and notable improvements
- case-level links from markdown report to fixture files and failure details

Suggested leaderboard sections:

- overall weighted score
- extraction score
- agent score
- provenance score
- DocVQA score
- hardest failing slices

Repo impact:

- `evals/reports/latest.json`
- `evals/reports/latest.md`
- `README.md`
- `docs/`

Acceptance criteria:

- README links to a richer eval report with mode and slice scoreboards
- the checked-in report is good enough for users to evaluate the project without running it

## Proposed Release Sequence

### Release 1.4 - Grounded Extraction

- add provenance metadata to templates and agentic output
- extend eval schema with provenance assertions
- add slice tags and richer reporting

### Release 1.5 - Agent Scoreboards

- add agent trace events and behavior assertions
- split extraction score from agent score
- add more difficult agentic cases

### Release 1.6 - Document QA

- add `docvqa` eval mode
- ship first cross-document reasoning suite
- publish separate reasoning leaderboard

### Release 1.7 - Ablations And Public Comparisons

- add experiment profiles
- publish baseline vs ablation comparisons
- tune agent architecture based on evidence, not intuition

## Implementation Plan By Repo Area

### Evals Core

Update:

- `src/lib/evals.ts`
- `evals/run.ts`
- `evals/render-report.ts`
- `evals/validate.ts`
- `evals/config.json`

Add support for:

- new eval mode: `docvqa`
- provenance assertions
- agent-behavior assertions
- slice aggregation
- experiment profiles

### Corpus And Cases

Expand:

- `evals/corpus/`
- `evals/cases/`

Add folder conventions:

```text
evals/
  corpus/
    invoices/
    receipts/
    reports/
    slides/
    diagrams/
    handwriting/
  cases/
    simple/
    template/
    agentic/
    docvqa/
```

### Agent Runtime

Update:

- `src/lib/agentLoop.ts`
- `src/lib/agentTools.ts`
- `src/lib/agentGemini.ts`
- `src/lib/agentTypes.ts`

Add:

- trace events
- stop-reason normalization
- provenance write-back
- experiment-profile overrides

### Template Runtime

Update:

- `src/lib/templates/engine.ts`
- `src/store/useTemplateOcrStore.ts`

Add:

- provenance metadata
- artifact rendering with grounded fields
- harder fixtures for each preset

### Public Docs

Update:

- `README.md`
- `ROADMAP.md`
- `docs/`

Add:

- leaderboard snapshot
- explanation of provenance
- explanation of agent score vs extraction score
- slice-based result summaries

## Success Metrics

We should consider this plan successful when:

- the repo has a public eval suite that is meaningfully broader than plain OCR extraction
- agentic OCR is measured on both outcome and tool behavior
- outputs can show where important fields came from
- the README can credibly compare `simple`, `template`, `agentic`, and `docvqa`
- contributors can add cases and profiles without reading core runtime code first

## Risks And Constraints

- dataset licensing matters; prefer owned, sanitized, or redistributable fixtures
- provenance support may be approximate until we add stronger region handling
- multi-page reasoning evals will cost more to run than current cases
- reports can become noisy if we add too many metrics before stabilizing the schema

## Recommended First Build Order

1. Add provenance fields and provenance assertions.
2. Add slice tags and richer report summaries.
3. Add agent trace events and agent-behavior scoreboards.
4. Expand corpus with harder robustness slices.
5. Add `docvqa` mode and first reasoning cases.
6. Add experiment profiles and ablation reports.
7. Refresh README once the new scoreboards are real.

## External References

These references informed the plan, but the selected primary benchmark set is limited to `OCRBench v2`, `OmniDocBench`, and `DocVQA 2026`:

- [OCRBench v2](https://arxiv.org/abs/2501.00321)
- [OmniDocBench](https://github.com/opendatalab/OmniDocBench)
- [DocVQA 2026](https://huggingface.co/datasets/VLR-CVC/DocVQA-2026)
- [OCR-Agent](https://arxiv.org/abs/2602.21053)
- [olmOCR and olmOCR-Bench](https://github.com/allenai/olmocr)
- [BFCL v4 leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html)
- [tau2-bench](https://github.com/sierra-research/tau2-bench)
- [StableToolBench](https://github.com/THUNLP-MT/StableToolBench)

## Decision

We should do all of this, in order, and treat it as the repo's next major expansion track after Templates and the first AI eval foundation.
