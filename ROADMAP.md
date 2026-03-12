# Roadmap

## Release 1.1 - Templates And Eval Foundations

- Ship the new Templates workflow for invoice, receipt, resume, and business card extraction.
- Add markdown, JSON, and CSV artifacts from a single extraction run.
- Land the first `evals/` corpus, fixture validation, and nightly live eval workflow.
- Tighten package metadata, README proof, and baseline trust signals.

## Release 1.2 - Custom Presets And Sharing

- Add user-defined extraction presets built on the same `ExtractionRule` schema.
- Support importing and exporting presets as JSON.
- Add preset-focused Discussions usage with `show-and-tell` and `eval-failures` categories.
- Publish richer checked-in eval reports with case-by-case diffs.

## Release 1.3 - Reliability And Expansion

- Expand the eval corpus with harder handwritten, multi-page, and noisy-scan samples.
- Bring more non-networked agentic logic into coverage and tighten regression tests.
- Improve Web OCR reliability messaging and add stronger fallback diagnostics.
- Add more document templates such as purchase orders, contracts, and forms.

## Contribution Focus

- `good first issue`: Docs polish, eval fixtures, preset copy, and result rendering polish.
- `help wanted`: New preset definitions, additional eval cases, and custom preset authoring.
- `docs`: README visuals, workflow explainers, and evaluation documentation.

If you want to contribute, start with fixtures or preset definitions. They are the fastest way to move the product and the public proof layer at the same time.
