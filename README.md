# Open Gemini OCR

Open-source OCR app for images, PDFs, and URLs using Google Gemini.

## Features

- Simple OCR for plain text extraction to markdown
- Templates for invoice, receipt, resume, and business card extraction
- Markdown, JSON, and CSV artifacts from a single template run
- Bulk OCR for multi-file jobs
- Web OCR for URL-based extraction when Gemini URL context is available
- Agent mode for iterative recovery on harder structured documents
- Assertion-based AI evals under `evals/`

## Modes

| Mode | Best for | Output | Status |
| --- | --- | --- | --- |
| Simple | Plain OCR from one image or PDF | Markdown | Stable |
| Templates | Structured documents | Markdown, JSON, CSV | Recommended |
| Bulk | Multi-file extraction | Combined markdown | Stable |
| Web | URL-based extraction | Markdown | Depends on Gemini URL support |
| Agent | Recovery on harder structured docs | Structured fields | Experimental |

## Requirements

- Node.js `>= 20.19.0`
- npm
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Quick Start

```bash
git clone https://github.com/cyanxxy/gemini-ocr.git
cd gemini-ocr
npm install
npm run dev
```

Open `http://localhost:5173`, add your Gemini API key in Settings, then start with `Templates` for structured extraction or `Simple` for plain OCR.

## AI Evals

The repo includes a small assertion-based eval suite under `evals/`.

```bash
npm run evals:validate
GEMINI_API_KEY=your_key npm run evals
npm run evals:report
```

Files:

- [evals/cases](evals/cases)
- [evals/corpus](evals/corpus)
- [evals/reports/latest.md](evals/reports/latest.md)
- [evals/reports/latest.json](evals/reports/latest.json)

## Limits

- Max file size: `20 MB` per file
- Supported local files: images and PDFs
- Web OCR accepts up to `20` URLs per request

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:coverage
npm run evals
npm run evals:report
npm run evals:validate
```

## Security And Privacy

- API keys are stored in `localStorage` with lightweight obfuscation
- Files are processed client-side before Gemini API calls
- Model requests are sent to Google APIs

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, checks, and PR guidance.

## License

MIT. See [LICENSE](LICENSE).
