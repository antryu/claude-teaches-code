# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React + TypeScript + Vite)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ CodeEditor   │  │  Workflow    │  │  ThinkingProcess   │   │
│  │  (Monaco)    │  │  Visualizer  │  │  (Extended Think)  │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Explanation  │  │  Language    │  │  Theme Toggle      │   │
│  │  Panel       │  │  Toggle      │  │  (Dark/Light)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                 │
│                     ↕ SSE (Server-Sent Events)                 │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│                    (Express.js + TypeScript)                    │
│                                                                 │
│  POST /api/generate        ─────→  SSE Streaming               │
│  POST /api/explain-line    ─────→  JSON Response               │
│  POST /api/alternatives    ─────→  JSON Response               │
│  GET  /api/health          ─────→  Health Status               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR LAYER                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              OrchestratorAgent                          │   │
│  │  • Analyzes user intent                                 │   │
│  │  • Routes to appropriate agents                         │   │
│  │  • Returns workflow plan                                │   │
│  │  • Bilingual support (EN/KO)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              ↓                                  │
│                    ┌─────────┴─────────┐                       │
│                    ↓                   ↓                        │
│         ┌──────────────────┐  ┌──────────────────┐            │
│         │  CodeGenAgent    │  │  ExplainAgent    │            │
│         │                  │  │                  │            │
│         │ • Generate code  │  │ • Deep explain   │            │
│         │ • <thinking>     │  │ • Extended Think │            │
│         │ • Best practices │  │ • Analogies      │            │
│         │ • Streaming      │  │ • Key concepts   │            │
│         └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE SONNET 4.5                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Model: claude-sonnet-4-5-20250929                       │  │
│  │                                                          │  │
│  │  Features:                                               │  │
│  │  • Extended Thinking (10K token budget)                  │  │
│  │  • Streaming responses                                   │  │
│  │  • Bilingual system prompts                             │  │
│  │  • <thinking> tag support                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                      MCP SERVER LAYER                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Documentation MCP Server                      │   │
│  │                                                         │   │
│  │  Tools:                                                 │   │
│  │  • fetch_docs    → DevDocs API                         │   │
│  │  • search_examples → GitHub Search                      │   │
│  │                                                         │   │
│  │  Features:                                              │   │
│  │  • 1-hour cache TTL                                     │   │
│  │  • Error handling                                       │   │
│  │  • Standalone mode                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐   │
│  │   DevDocs    │    │   GitHub     │    │   Anthropic    │   │
│  │     API      │    │   API        │    │     API        │   │
│  └──────────────┘    └──────────────┘    └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Code Generation Flow

```
User Input
    ↓
[Frontend: App.tsx]
    ↓
handleGenerate()
    ↓
[API Service: generateCodeStream()]
    ↓
POST /api/generate (SSE)
    ↓
[Backend: generate.ts]
    ↓
OrchestratorAgent.analyze()
    ↓ (workflow plan)
CodeGenAgent.generateStream()
    ↓
Claude Sonnet 4.5
    ↓ (streaming chunks)
SSE Messages:
  - workflow
  - thinking
  - code
  - complete
    ↓
[Frontend: SSE Handler]
    ↓
State Updates:
  - setWorkflow()
  - setThinking()
  - setGeneratedCode()
    ↓
UI Components Update:
  - WorkflowVisualizer (animated)
  - ThinkingProcess (collapsible)
  - CodeEditor (Monaco display)
```

### 2. Line Explanation Flow

```
User Clicks "?" Icon
    ↓
[CodeEditor: onExplainLine(lineNumber)]
    ↓
handleExplainLine()
    ↓
[API Service: explainLine()]
    ↓
POST /api/explain-line
    ↓
[Backend: explain.ts]
    ↓
ExplainAgent.explainLine()
    ↓
Claude Sonnet 4.5
(with Extended Thinking: 10K tokens)
    ↓
Parse Response:
  - thinking
  - extendedThinking
  - explanation
  - keyConcepts
  - commonMistakes
    ↓
[Frontend: Response Handler]
    ↓
State Updates:
  - setLineExplanations()
  - setExplanation()
    ↓
UI Components Update:
  - ExplanationPanel (Markdown)
  - CodeEditor (inline tooltip)
```

### 3. Bilingual System Flow

```
User Toggles Language
    ↓
[Frontend: toggleLanguage()]
    ↓
setLanguage('ko' | 'en')
    ↓
i18n.changeLanguage()
    ↓
UI Text Updates (react-i18next)
    ↓
API Calls Include:
  { language: 'ko' | 'en' }
    ↓
[Backend: loadLocale(language)]
    ↓
Load locale/ko.json or locale/en.json
    ↓
Agent System Prompts:
  - Orchestrator (Korean/English)
  - CodeGenAgent (Korean/English)
  - ExplainAgent (Korean/English)
    ↓
Claude Responds in Selected Language
    ↓
[Frontend: Display Localized Response]
```

## Component Architecture

### Frontend Component Tree

```
App.tsx (Root)
├── Header
│   ├── Title & Subtitle (i18n)
│   ├── LanguageToggle (🌐)
│   └── ThemeToggle (🌙/☀️)
│
├── Main Content (Grid Layout)
│   ├── Left Panel (lg:col-span-2)
│   │   ├── Input Section
│   │   │   ├── Textarea (prompt input)
│   │   │   └── Generate Button
│   │   ├── WorkflowVisualizer
│   │   │   ├── Intent Display
│   │   │   ├── Agent Steps (animated)
│   │   │   └── Reasoning Panel
│   │   └── ThinkingProcess
│   │       ├── Collapse/Expand Button
│   │       ├── Regular Thinking
│   │       └── Extended Thinking (10K)
│   │
│   └── Right Panel (lg:col-span-1)
│       └── ExplanationPanel
│           ├── Main Explanation (Markdown)
│           ├── Key Concepts (blue box)
│           ├── Common Mistakes (amber box)
│           └── Extended Thinking (purple box)
│
└── Bottom Section (Full Width)
    └── CodeEditor (Monaco)
        ├── Header (language badge, copy, download)
        ├── Editor Area
        │   ├── Line Numbers
        │   ├── Glyph Margin (? icons)
        │   └── Syntax Highlighting
        └── Footer (key decisions, next steps)
```

### Backend Module Structure

```
index.ts (Express Server)
├── Middleware
│   ├── CORS
│   ├── JSON Parser
│   └── Error Handler
│
├── Agent Initialization
│   ├── OrchestratorAgent
│   ├── CodeGenAgent
│   └── ExplainAgent
│
├── Routes
│   ├── /api/generate (SSE)
│   │   └── Orchestrator → CodeGen/Explain
│   ├── /api/explain-line
│   │   └── ExplainAgent.explainLine()
│   ├── /api/alternatives
│   │   └── ExplainAgent.explain()
│   └── /api/health
│       └── System status
│
└── MCP Server (Optional)
    ├── fetch_docs tool
    └── search_examples tool
```

## State Management

### Frontend State (React useState)

```typescript
// Main App State
const [theme, setTheme] = useState<'light' | 'dark'>('dark')
const [language, setLanguage] = useState<Language>('en')
const [prompt, setPrompt] = useState('')
const [isGenerating, setIsGenerating] = useState(false)

// AI Response State
const [workflow, setWorkflow] = useState<OrchestratorResponse | null>(null)
const [currentStep, setCurrentStep] = useState<string | null>(null)
const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
const [thinking, setThinking] = useState('')
const [extendedThinking, setExtendedThinking] = useState('')
const [explanation, setExplanation] = useState<ExplanationResponse | null>(null)
const [lineExplanations, setLineExplanations] = useState<LineExplanation[]>([])

// Error State
const [error, setError] = useState<string | null>(null)
```

### Backend State (In-Memory)

```typescript
// Agent Instances (Singleton)
const orchestrator = new OrchestratorAgent(apiKey)
const codeGen = new CodeGenAgent(apiKey)
const explain = new ExplainAgent(apiKey, thinkingBudget)

// MCP Server Cache (node-cache)
const cache = new NodeCache({ stdTTL: 3600 })
// Keys: "docs:library:query", "examples:query:lang"
```

## API Communication Patterns

### SSE (Server-Sent Events) Stream

```typescript
// Frontend: Async Generator
for await (const message of generateCodeStream(prompt, language)) {
  switch (message.type) {
    case 'workflow': setWorkflow(message.data); break;
    case 'thinking': setThinking(prev => prev + message.data.chunk); break;
    case 'code': setGeneratedCode(message.data); break;
    case 'explanation': setExplanation(message.data); break;
    case 'complete': setCurrentStep('complete'); break;
    case 'error': setError(message.data.message); break;
  }
}

// Backend: SSE Writer
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')

const sendSSE = (message: SSEMessage) => {
  res.write(`data: ${JSON.stringify(message)}\n\n`)
}
```

### Regular HTTP Request/Response

```typescript
// Frontend: Fetch API
const response = await fetch('/api/explain-line', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, lineNumber, language })
})
const { data } = await response.json()

// Backend: Express Handler
router.post('/explain-line', async (req, res) => {
  const { code, lineNumber, language } = req.body
  const explanation = await explain.explainLine(code, lineNumber, language)
  res.json({ success: true, data: explanation })
})
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│          Security Layers                │
│                                         │
│  1. Environment Variables               │
│     • ANTHROPIC_API_KEY (backend only)  │
│     • Never exposed to frontend         │
│     • .env files in .gitignore          │
│                                         │
│  2. CORS Configuration                  │
│     • Whitelist frontend origin         │
│     • Credentials allowed               │
│     • Preflight caching                 │
│                                         │
│  3. Request Validation                  │
│     • Body size limits (10MB)           │
│     • Type checking (TypeScript)        │
│     • Input sanitization                │
│                                         │
│  4. Error Handling                      │
│     • Sanitized error messages          │
│     • No stack traces in production     │
│     • Structured logging                │
│                                         │
│  5. Frontend Security                   │
│     • React XSS protection              │
│     • No eval() or innerHTML            │
│     • Content Security Policy ready     │
└─────────────────────────────────────────┘
```

## Performance Optimizations

### Frontend
1. **Code Splitting**: Vite automatic chunking
2. **Lazy Loading**: Monaco Editor loaded on demand
3. **Memoization**: React.memo for heavy components
4. **Debouncing**: Input debouncing for API calls
5. **Virtual DOM**: React's efficient rendering

### Backend
1. **Streaming**: SSE for progressive loading
2. **Caching**: 1-hour TTL for MCP responses
3. **Connection Pooling**: HTTP keep-alive
4. **Async Operations**: Non-blocking I/O
5. **Compression**: Gzip responses

### AI Optimization
1. **Token Management**: Budget allocation
2. **Streaming Tokens**: Progressive display
3. **Prompt Engineering**: Efficient prompts
4. **Context Management**: Minimal context reuse

## Deployment Architecture

### Development
```
localhost:3000 (Frontend Vite Dev Server)
       ↓ Proxy
localhost:3001 (Backend Express Server)
       ↓ API
api.anthropic.com (Claude API)
```

### Production
```
CDN/Nginx (Frontend Static Files)
       ↓
Load Balancer
       ↓
Node.js Server (Backend API)
       ↓ API
api.anthropic.com (Claude API)
```

### Environment Variables Flow
```
.env.example (Template)
       ↓ (Copy & Configure)
.env (Local Development)
       ↓ (Deploy)
Environment Variables (Production)
       ↓ (Runtime)
process.env.* (Application)
```

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                       │
├─────────────────────────────────────────────────────────┤
│ React 19          │ UI Framework                        │
│ TypeScript 5.7    │ Type Safety                         │
│ Vite 6.0          │ Build Tool & Dev Server            │
│ Tailwind CSS 3.4  │ Styling                            │
│ Monaco Editor 4.6 │ Code Editor                         │
│ Framer Motion 11  │ Animations                          │
│ react-i18next 15  │ Internationalization               │
│ react-markdown 9  │ Markdown Rendering                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Backend Stack                        │
├─────────────────────────────────────────────────────────┤
│ Node.js 18+       │ Runtime                            │
│ TypeScript 5.7    │ Type Safety                         │
│ Express 4.21      │ Web Framework                       │
│ Anthropic SDK 0.32│ Claude AI Integration              │
│ MCP SDK 1.0       │ Model Context Protocol             │
│ node-cache 5.1    │ In-Memory Caching                  │
│ Axios 1.7         │ HTTP Client                         │
│ Zod 3.24          │ Schema Validation                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    AI & Services                        │
├─────────────────────────────────────────────────────────┤
│ Claude Sonnet 4.5 │ AI Model                           │
│ Extended Thinking │ 10K Token Deep Analysis            │
│ DevDocs API       │ Documentation                       │
│ GitHub API        │ Code Examples                       │
└─────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2024
**Status**: Production Ready ✅
