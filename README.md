# Open Gemini OCR

Open-source OCR web app for extracting text from images, PDFs, and URLs using Google Gemini models.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository-url=https://github.com/cyanxxy/open-Gemini-ocr)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cyanxxy/open-Gemini-ocr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Simple OCR for single-image and PDF extraction
- Advanced OCR for rule-based extraction and bulk workflows
- Web OCR for URL analysis and extraction with fallback strategies
- Agentic OCR with iterative function-calling loops
- Handwriting mode for more difficult text
- Markdown-first output with copy/export support
- Theme support (Light, Dark, AMOLED)

## Supported Models

The app currently exposes these preview models in settings:

| Model | API model ID | Thinking levels |
| --- | --- | --- |
| Gemini 3 Flash (Preview) | `gemini-3-flash-preview` | `MINIMAL`, `LOW`, `MEDIUM`, `HIGH` |
| Gemini 3.1 Pro (Preview) | `gemini-3.1-pro-preview` | `LOW`, `MEDIUM`, `HIGH` |

Notes:
- `MINIMAL` is Flash-only.
- Existing saved `gemini-3-pro-preview` settings are migrated to `gemini-3.1-pro-preview`.

## Requirements

- Node.js `>= 20.19.0`
- npm (or yarn/pnpm equivalent)
- Google Gemini API key ([Get key](https://aistudio.google.com/app/apikey))

## Quick Start

```bash
git clone https://github.com/cyanxxy/open-Gemini-ocr.git
cd open-Gemini-ocr
npm install
npm run dev
```

Open `http://localhost:5173`, then:

1. Open **Settings**
2. Paste your Gemini API key
3. Choose a model and reasoning level
4. Upload files or start URL/agent workflows

## Limits and Input Support

- Max file size: **20 MB** per file
- Supported local files: images (`image/*`) and PDFs (`application/pdf`)
- Web OCR: up to **20 URLs** per request

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
npm run test:run
npm run test:coverage
npm run test:ui
```

## Project Structure

```text
src/
  components/         UI components
  pages/              App routes (Simple, Web, Advanced, Agentic)
  store/              Zustand state stores
  lib/gemini/         Gemini client, extraction, URL operations, types
  lib/agent*.ts       Agent loop, tools, and Gemini turn execution
  hooks/              Reusable React hooks
  utils/              Shared utilities
```

## Security and Privacy

- API keys are saved in localStorage with lightweight obfuscation.
- This is not a substitute for secure secret storage on shared/untrusted devices.
- Files are processed client-side before Gemini API calls; model requests are sent to Google APIs.

See [SECURITY.md](SECURITY.md) for reporting and policy details.

## Deployment

- One-click deploy via Netlify/Vercel buttons above
- Or build and host static output:

```bash
npm run build
```

Deploy the `dist/` directory to your static hosting provider.

## Contributing

Contributions are welcome. Please read:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md)

## Troubleshooting

- If API tests fail, verify key format/access and selected model availability.
- If URL extraction fails, your key/model may not have URL context access in your region.
- For weak OCR quality, try a higher reasoning level, handwriting mode, or Agentic OCR.

## License

MIT. See [LICENSE](LICENSE).
