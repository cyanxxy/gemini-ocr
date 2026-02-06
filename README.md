# OCR Tool with Gemini 3 Models (Preview)

A production-ready OCR application powered by Google's Gemini 3 preview models. This application provides intelligent text extraction from images and PDFs with configurable processing rules, autonomous agent-based OCR, and advanced AI capabilities including thinking levels.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository-url=https://github.com/cyanxxy/open-Gemini-ocr)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cyanxxy/open-Gemini-ocr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Core OCR Capabilities
- **Simple OCR**: Fast text extraction from images and PDFs with one-click processing
- **Advanced OCR**: Custom extraction rules and bulk batch processing for structured data (invoices, forms, receipts)
- **Web OCR**: URL-based content extraction with multi-URL support and multiple analysis modes
- **Agentic OCR**: Autonomous AI agent that iteratively improves extraction quality
- **Handwriting Recognition**: Enhanced mode for handwritten text and sketches
- **Multi-format Support**: Images (PNG, JPG, JPEG, WebP, HEIC, HEIF) and PDFs

### AI-Powered Intelligence
- **Google Gemini 3 Models (Preview)**: Leveraging the latest AI technology including thinking levels
- **Structured Data Extraction**: Extract specific fields with custom rules and validation
- **Mathematical Equations**: Automatic detection and LaTeX formatting with KaTeX
- **Image Analysis**: Intelligent description and analysis of charts, diagrams, and visual elements
- **Multi-column Layout**: Smart handling of complex document layouts and formatting
- **Thinking Levels**: Adjustable reasoning depth (Minimal/Low/Medium/High where supported)

### User Experience
- **Real-time Processing**: Live feedback and progress indicators
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light/AMOLED Themes**: Multiple theme options for comfortable viewing
- **Markdown Rendering**: Rich text output with syntax highlighting
- **Copy & Export**: One-click copying and file export capabilities
- **Persistent Settings**: API keys and preferences saved in obfuscated localStorage

### Developer Features
- **TypeScript**: Full type safety with strict mode and no implicit any
- **Modern React**: Built with React 18+ and modern hooks
- **State Management**: Zustand with persist middleware for efficient state handling
- **Component Architecture**: Atomic design pattern (atoms → molecules → organisms)
- **Testing**: Comprehensive test suite with Vitest and React Testing Library
- **Production Logger**: Environment-aware logging with automatic sanitization
- **Error Boundaries**: Graceful error recovery in production

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18+, TypeScript 5.8+, Vite 7+ |
| **Styling** | Tailwind CSS, Tailwind Typography |
| **State Management** | Zustand 4.5+ with persist middleware |
| **AI/ML** | @google/genai SDK (Gemini 3 preview) |
| **File Processing** | React Dropzone, File API |
| **Markdown** | Streamdown, KaTeX |
| **Testing** | Vitest, React Testing Library |
| **Build & Deploy** | Vite, Netlify, Vercel |
| **Code Quality** | ESLint 9+, TypeScript, Audit CI |

## Quick Start

### Prerequisites
- Node.js 20+ and npm/yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone the repository
git clone https://github.com/cyanxxy/open-Gemini-ocr.git
cd open-Gemini-ocr

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

### Configuration
1. Open the application in your browser (typically `http://localhost:5173`)
2. Click the settings icon and enter your Google Gemini API key
3. Choose your preferred model and settings
4. Configure thinking level if desired (Gemini 3 feature)
5. Start processing documents!

## Project Structure

```
src/
├── components/          # React components organized by atomic design
│   ├── atoms/          # Basic UI components (Button, Toggle)
│   ├── molecules/      # Composite components (Alert, Card, FileListItem, UrlInput)
│   ├── organisms/      # Complex components (ApiKeyPrompt, BulkFileList, FileDropzone)
│   ├── layout/         # Layout components (Header, Footer, Layout)
│   └── modals/         # Modal dialogs (SettingsModal)
├── contexts/           # React contexts (LayoutContext)
├── hooks/              # Custom hooks (clipboard, uploads, cleanup)
├── lib/                # Core library functions
│   ├── gemini/         # Gemini API client and types
│   ├── agentGemini.ts  # Agent Gemini integration
│   ├── agentLoop.ts    # Agent control loop
│   ├── agentTools.ts   # Agent function implementations
│   ├── agentTypes.ts   # Agent TypeScript interfaces
│   ├── crypto.ts       # Encryption utilities
│   ├── fileUtils.ts    # File processing utilities
│   └── logger.ts       # Production-safe logging
├── pages/              # Main application pages
│   ├── SimpleOCR.tsx   # Basic OCR functionality
│   ├── AdvancedOCR.tsx # Bulk processing with extraction rules
│   ├── WebOCR.tsx      # URL-based content extraction
│   └── AgenticOCR.tsx  # Autonomous agent-based OCR
├── store/              # Zustand state management
│   ├── base/           # Base store patterns
│   └── use*.ts         # Feature-specific stores
├── design/             # Theme and design system
├── utils/              # Shared utilities
└── App.tsx             # Main application component
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally

# Testing
npm test             # Run test suite
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
```

### Development Workflow

1. **Fork & Clone**: Fork the repository and clone your fork
2. **Branch**: Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Develop**: Make your changes with tests
4. **Test**: Ensure all tests pass (`npm test`)
5. **Lint**: Check code quality (`npm run lint`)
6. **Commit**: Commit with conventional commit messages
7. **Push**: Push to your fork (`git push origin feature/amazing-feature`)
8. **PR**: Open a Pull Request with detailed description

## Testing

The project includes comprehensive testing with Vitest and React Testing Library:

- **Unit Tests**: Utility functions and hooks
- **Store Tests**: Zustand store actions and state
- **Component Tests**: React component behavior
- **Integration Tests**: Feature workflows

### Test Coverage Areas
- File utilities (validation, reading, processing)
- Encryption/decryption functions
- Logger with environment detection
- Store actions and state management
- Custom hooks

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests once
npm run test:run

# Run tests in the UI
npm run test:ui
```

## Deployment

### Automated Deployment

The project is configured for automatic deployment:

- **Netlify**: Connected to GitHub for automatic deployments
- **Vercel**: One-click deployment with the Vercel button
- **Custom Hosting**: Build and deploy the `dist` folder

### Manual Deployment

```bash
# Build for production
npm run build

# The `dist` folder contains the built application
# Deploy the contents to your hosting provider
```

### Environment Variables

No environment variables are required for basic functionality. The application stores the API key in obfuscated localStorage.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Steps
1. Check [existing issues](../../issues) or [create a new one](../../issues/new)
2. Fork the repository
3. Create a feature branch
4. Make your changes with tests
5. Submit a Pull Request

### Code of Conduct
Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## API Integration

### Google Gemini API Setup

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create a new API key
3. Add the key to your settings in the application
4. Choose your preferred model

### Supported Models
- **Gemini 3 Flash (Preview)**: Fast processing, excellent for most OCR tasks
- **Gemini 3 Pro (Preview)**: Advanced capabilities for complex documents

### Thinking Levels (Gemini 3 Feature)
Configure reasoning depth:
- **Minimal/Low/Medium/High**: Available options depend on the selected model
- **Include Thoughts**: Optional setting to include thinking content in responses

## Agentic OCR Architecture

### Overview
The Agentic OCR feature introduces an autonomous AI agent that iteratively processes documents to achieve high-quality text extraction. Unlike traditional OCR that processes documents in a single pass, the agent:

1. **Analyzes** the document structure and identifies the document type
2. **Plans** an extraction strategy based on the document layout
3. **Extracts** text systematically, field by field
4. **Validates** extracted data for accuracy and consistency
5. **Iterates** to improve results until confidence thresholds are met

### Agent Functions

The agent has access to specialized functions:

- **`analyze_document_structure`**: Analyzes layout and determines extraction strategy
- **`extract_field`**: Extracts specific fields with confidence scoring
- **`re_ocr_region`**: Re-processes specific regions for improved accuracy
- **`validate_extraction`**: Validates data against business rules
- **`finalize_extraction`**: Completes the process with quality assessment

### Architecture Components

```
AgenticOCR/
├── lib/
│   ├── agentLoop.ts        # Main agent control loop
│   ├── agentGemini.ts      # Gemini AI integration for agents
│   ├── agentTools.ts       # Tool implementations and function definitions
│   └── agentTypes.ts       # TypeScript interfaces
├── store/
│   └── useAgenticOcrStore.ts # Zustand store for agent state
└── pages/
    └── AgenticOCR.tsx      # UI component
```

### Key Features

- **Autonomous Processing**: Agent decides next actions based on results
- **Iterative Improvement**: Multiple passes to achieve target confidence
- **Memory Persistence**: Maintains context across iterations
- **Progress Tracking**: Real-time status updates and logging
- **Function Calling**: Structured interaction with Gemini AI
- **Quality Metrics**: Confidence scores and validation results

### Usage Example

1. Upload a document (image or PDF)
2. Configure agent settings (max iterations, confidence threshold)
3. Click "Start Agent" and watch the autonomous processing
4. View extracted fields with confidence scores
5. Export results in your preferred format

## Troubleshooting

### Common Issues

**Q: "API key not working"**
A: Ensure your API key is valid and has the correct permissions for Gemini API access.

**Q: "File upload fails"**
A: Check file size limits (20MB) and supported formats. Ensure the file is not corrupted.

**Q: "Poor OCR accuracy"**
A: Try enabling handwriting mode for handwritten text, or use advanced rules for structured documents. Consider using the Agentic OCR for complex documents.

**Q: "App not loading"**
A: Clear browser cache and ensure JavaScript is enabled. Check browser console for errors.

**Q: "Thinking level not working"**
A: Ensure you're using a Gemini 3 model and have selected a supported thinking level for that model.

### Performance Tips
- Use appropriate image resolution (300-600 DPI recommended)
- Ensure good lighting and contrast for scanned documents
- Use advanced rules for consistent document types
- Enable batch processing for multiple similar documents
- Consider using Agentic OCR for complex or low-quality documents

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for powerful AI capabilities
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) communities
- [Tailwind CSS](https://tailwindcss.com/) for excellent styling utilities
- [Zustand](https://github.com/pmndrs/zustand) for elegant state management
- All contributors and users who help improve this project

## Support

- [Documentation](../../wiki)
- [Bug Reports](../../issues)
- [Feature Requests](../../issues)
- [Discussions](../../discussions)

---

<div align="center">
  <p>
    <a href="#ocr-tool-with-gemini-3-models-preview">Back to Top</a>
  </p>
</div>
