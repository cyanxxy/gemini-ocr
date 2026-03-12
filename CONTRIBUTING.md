# Contributing

Thanks for contributing to Open Gemini OCR.

## Good First Contributions

- Add or improve eval fixtures under `evals/cases/` and `evals/corpus/`
- Tighten README and docs
- Improve shipped preset copy or result rendering
- Add tests for non-networked logic

Look for issues labeled:

- `good first issue`
- `help wanted`
- `docs`

## Local Setup

```bash
git clone https://github.com/cyanxxy/gemini-ocr.git
cd gemini-ocr
npm install
npm run dev
```

Before opening a PR, run:

```bash
npx tsc --noEmit
npm run lint
npm run test:coverage
npm run build
npm run evals:validate
```

## Pull Requests

1. Fork the repo and create a focused branch.
2. Keep changes scoped to one concern when possible.
3. Add or update tests for behavior changes.
4. Update docs when user-facing behavior changes.
5. If your change affects templates or evals, include the fixture or report impact in the PR description.

Use [Conventional Commits](https://www.conventionalcommits.org/) when practical.

## Templates And Evals

- New presets should reuse the shared `ExtractionRule` schema.
- New eval cases should use assertion-based checks instead of prose-only expectations.
- Do not commit private or sensitive documents to `evals/corpus/`.
- Keep checked-in reports under `evals/reports/` readable and deterministic.

## Discussions

If Discussions are enabled, use:

- `show-and-tell` for sharing presets or workflows
- `eval-failures` for reporting misses and regressions

## Releases

Releases are created from version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow and attaches the production build output.
