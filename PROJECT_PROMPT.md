# Claude Teaches Code - Full Project Prompt

## Project Overview
Create a full-stack AI-powered code learning assistant called "Claude Teaches Code" that generates code with detailed explanations, allows interactive code execution, and saves results to Notion.

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Python Runtime**: Pyodide (browser-based Python)
- **Markdown**: react-markdown, remark-gfm
- **i18n**: react-i18next (English/Korean support)

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929) with Extended Thinking
- **Dev Tools**: tsx (TypeScript execution), nodemon

## Core Features

### 1. Intelligent Code Generation
- Multi-agent architecture (Orchestrator, CodeGen, Explain)
- Extended Thinking for deep analysis (10,000 token budget)
- Real-time streaming responses
- Auto-detect programming language from code content
- Workflow visualization showing agent progression

### 2. Interactive Code Execution
- **JavaScript**: Execute in browser sandbox with console.log capture
- **Python**: Execute using Pyodide in browser
- Display execution results with timing
- Error handling and output formatting

### 3. Line-by-Line Explanation
- Click any code line to get instant explanation
- Explanations appear in right panel
- Uses Claude API for contextual analysis

### 4. Notion Integration
- Save generated code and explanations to Notion database
- Include execution results and metadata
- One-click save functionality

### 5. Internationalization
- Default language: English
- Korean translation support
- Language toggle button in header
- All UI components fully translated

## Project Structure

```
claude-teaches-code/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── orchestrator.ts    # Route requests to appropriate agents
│   │   │   ├── codeGen.ts         # Code generation with language detection
│   │   │   └── explain.ts         # Code explanation and line analysis
│   │   ├── routes/
│   │   │   ├── generate.ts        # Code generation endpoints
│   │   │   ├── explain.ts         # Explanation endpoints
│   │   │   ├── playground.ts      # Code execution endpoint
│   │   │   └── notion.ts          # Notion integration
│   │   ├── locales/
│   │   │   ├── en.json           # English prompts for agents
│   │   │   └── ko.json           # Korean prompts for agents
│   │   ├── types/index.ts        # TypeScript interfaces
│   │   └── index.ts              # Express server setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.tsx         # Monaco editor with line click
│   │   │   ├── ExplanationPanel.tsx   # Markdown explanation display
│   │   │   ├── CodePlayground.tsx     # Code execution UI
│   │   │   ├── ThinkingProcess.tsx    # Extended thinking display
│   │   │   ├── WorkflowVisualizer.tsx # Agent workflow display
│   │   │   └── NotionSaveButton.tsx   # Notion integration UI
│   │   ├── i18n/
│   │   │   ├── config.ts         # i18next configuration
│   │   │   ├── en.json          # English translations
│   │   │   └── ko.json          # Korean translations
│   │   ├── services/
│   │   │   └── api.ts           # API client functions
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   ├── App.tsx              # Main application
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Detailed Implementation Instructions

### Step 1: Backend Setup

1. **Initialize Backend**:
```bash
mkdir claude-teaches-code && cd claude-teaches-code
mkdir backend && cd backend
npm init -y
npm install express cors dotenv @anthropic-ai/sdk
npm install -D typescript tsx @types/node @types/express @types/cors
npx tsc --init
```

2. **Create Agent System**:

**Orchestrator Agent** (`src/agents/orchestrator.ts`):
- Analyzes user requests
- Routes to CodeGen or Explain agent
- Returns workflow steps

**CodeGen Agent** (`src/agents/codeGen.ts`):
- Generates code with Extended Thinking
- Detects programming language from code blocks
- Auto-detect from content if no language tag (function/const/let = JavaScript, def/import = Python)
- Returns: thinking, code, keyDecisions, nextSteps, language

**Explain Agent** (`src/agents/explain.ts`):
- Provides detailed code explanations
- Handles line-by-line explanations (no Extended Thinking for speed)
- Returns: explanation, thinking (optional)

3. **Create Routes**:

**Generate Route** (`src/routes/generate.ts`):
- POST `/api/generate` - Stream code generation
- Uses Server-Sent Events for real-time updates
- Returns orchestrator workflow + code + explanation

**Explain Route** (`src/routes/explain.ts`):
- POST `/api/explain-line` - Explain specific code line
- Fast response without Extended Thinking

**Playground Route** (`src/routes/playground.ts`):
- POST `/api/playground/execute` - Execute JavaScript code
- Sandbox execution with console capture
- Custom console.time/timeEnd implementation

4. **Environment Variables** (`.env`):
```
ANTHROPIC_API_KEY=your_api_key
EXTENDED_THINKING_BUDGET=10000
PORT=3001
```

### Step 2: Frontend Setup

1. **Initialize Frontend**:
```bash
cd .. && mkdir frontend && cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install @monaco-editor/react lucide-react react-markdown remark-gfm
npm install react-i18next i18next
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure Vite** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

3. **Configure Tailwind** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
```

4. **Setup i18n** (`src/i18n/config.ts`):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ko from './ko.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: 'en',
  fallbackLng: 'en',
});
```

### Step 3: Core Components

**App.tsx** - Main application layout:
- Header with title, language toggle (🌐), theme toggle (🌙/☀️)
- Input textarea for code generation requests
- Workflow visualizer
- Thinking process display (collapsible)
- 2-column layout:
  - Left: Code editor (450px) + Key Decisions/Next Steps (226px)
  - Right: Explanation panel (700px)
- Bottom 1:1 layout: Code Execution + Notion Save

**CodeEditor.tsx** - Monaco Editor integration:
- Display generated code
- Click line numbers to explain
- Copy and download buttons
- Syntax highlighting
- Dark/light theme support

**ExplanationPanel.tsx** - Markdown explanation display:
- Main explanation with markdown rendering
- Key Concepts section (optional)
- Common Mistakes section (optional)
- Extended Thinking section (optional)
- Scrollable with fixed 700px height

**CodePlayground.tsx** - Code execution:
- JavaScript execution in sandboxed Function
- Python execution with Pyodide
- Display output and execution time
- Error handling with formatted display

**NotionSaveButton.tsx** - Notion integration:
- Save button with loading state
- POST to `/api/notion/save`
- Success/error notifications

### Step 4: Key Implementation Details

**Language Detection** (backend):
```typescript
// 1. Try to extract from code block: ```javascript
const langMatch = code.match(/```(\w+)/);
let detectedLanguage = langMatch ? langMatch[1].toLowerCase() : 'text';

// 2. Normalize common variants
if (detectedLanguage === 'js') detectedLanguage = 'javascript';
if (detectedLanguage === 'py') detectedLanguage = 'python';

// 3. Auto-detect from content if still 'text'
if (detectedLanguage === 'text') {
  if (code.includes('function') || code.includes('const') || code.includes('let')) {
    detectedLanguage = 'javascript';
  } else if (code.includes('def ') || code.includes('import ')) {
    detectedLanguage = 'python';
  }
}
```

**Code Execution Sandbox** (backend):
```typescript
const sandbox = {
  console: {
    log: (...args) => output.push(args.join(' ')),
    time: (label) => timeLabels.set(label, Date.now()),
    timeEnd: (label) => {
      const duration = Date.now() - timeLabels.get(label);
      output.push(`${label}: ${duration}ms`);
    },
  },
  Math, JSON, Array, Object, String, Number, Boolean, Date,
};

const fn = new Function(...Object.keys(sandbox), code);
fn(...Object.values(sandbox));
```

**Line Explanation** (frontend):
```typescript
const handleLineClick = async (lineNumber: number) => {
  const result = await explainLine(
    generatedCode.code,
    lineNumber,
    language,
    generatedCode.language
  );

  setLineExplanations(prev => [
    ...prev.filter(e => e.lineNumber !== lineNumber),
    { lineNumber, explanation: result.explanation }
  ]);
};
```

### Step 5: Styling Guidelines

**Color Scheme**:
- Primary: Blue-600 to Purple-600 gradient
- Success: Green-600
- Error: Red-600
- Warning: Amber-600
- Info: Blue-600

**Layout Heights**:
- Code editor: 450px (fixed)
- Key Decisions box: 226px (fixed)
- Explanation panel: 700px (fixed)
- Total left column: 450px + 24px gap + 226px = 700px

**Responsive Design**:
- Desktop (lg): 2-column grid layout
- Mobile: Single column stack

**Dark Mode**:
- Toggle via state + document.documentElement.classList
- Monaco editor theme: 'vs-dark' or 'light'

### Step 6: API Integration

**Generate Code** (streaming):
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, language }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // Handle workflow, thinking, code, explanation
    }
  }
}
```

**Execute Code**:
```typescript
const response = await fetch('/api/playground/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});

const { success, data } = await response.json();
// data contains: success, output, executionTime, or error
```

## Environment Setup

**Backend** (`.env`):
```
ANTHROPIC_API_KEY=sk-ant-...
EXTENDED_THINKING_BUDGET=10000
PORT=3001
NOTION_API_KEY=secret_... (optional)
NOTION_DATABASE_ID=... (optional)
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3001
```

## Running the Project

**Development**:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Build**:
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## Testing Examples

**Code Generation Request**:
```
Create a Fibonacci sequence generator in JavaScript that returns an array of the first n numbers.
```

**Expected Workflow**:
1. Orchestrator analyzes request
2. Routes to CodeGen agent
3. Extended Thinking analyzes the problem
4. Generates optimized JavaScript code
5. Explain agent provides detailed explanation
6. Code displays in Monaco editor
7. Click line numbers for line-by-line explanations
8. Click "Run" to execute code
9. Click "Save to Notion" to save results

## Key Considerations

1. **Error Handling**: All API calls should have try-catch blocks
2. **Loading States**: Show loading indicators during async operations
3. **Validation**: Validate user input before API calls
4. **Security**: Sandbox code execution to prevent malicious code
5. **Performance**: Use React.memo for expensive components
6. **Accessibility**: Proper ARIA labels and keyboard navigation
7. **Responsive**: Mobile-first design approach
8. **i18n**: All user-facing text must use translation keys

## Future Enhancements (Optional)

- [ ] Code comparison feature
- [ ] Performance measurement
- [ ] Alternative implementations
- [ ] Export to multiple formats
- [ ] Code sharing via URL
- [ ] Syntax highlighting themes
- [ ] More language support (TypeScript, Python, Go, etc.)
- [ ] AI-powered code reviews
- [ ] Interactive tutorials
- [ ] Code playground sharing

---

**Build this project step-by-step, ensuring each component works before moving to the next. Test thoroughly at each stage.**
