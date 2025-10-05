# Claude Teaches Code - Advanced Architecture Prompt

## Project Overview
Build a production-grade, full-stack AI-powered code learning platform with multi-agent orchestration, MCP server integration, and intelligent workflow management. This system uses Claude Sonnet 4.5's Extended Thinking capabilities combined with MCP (Model Context Protocol) servers for enhanced functionality.

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Monaco  │  │ Workflow │  │ Thinking │  │  Notion  │   │
│  │  Editor  │  │Visualizer│  │ Process  │  │   Save   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + TypeScript)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Multi-Agent Orchestrator                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │Orchestrator│→ │  CodeGen   │→ │  Explain   │     │   │
│  │  │   Agent    │  │   Agent    │  │   Agent    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↓                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MCP Server Integration Layer            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Context7  │  │ Sequential │  │ Playwright │     │   │
│  │  │   (Docs)   │  │ (Analysis) │  │  (Testing) │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              External Services & APIs                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Claude    │  │   Notion   │  │  Pyodide   │           │
│  │    API     │  │    API     │  │ (Browser)  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Agent System Design

### 1. Orchestrator Agent

**Purpose**: Request routing and workflow coordination

**Responsibilities**:
- Analyze incoming user requests
- Determine required agents (CodeGen, Explain, or both)
- Coordinate multi-step workflows
- Manage agent communication
- Track workflow progress
- Handle error recovery and fallbacks

**Decision Tree**:
```typescript
interface RequestAnalysis {
  intent: 'code_generation' | 'explanation' | 'both' | 'question';
  complexity: 'simple' | 'moderate' | 'complex';
  requiredAgents: AgentType[];
  estimatedSteps: number;
  thinkingBudget: number;
}

async analyzeRequest(prompt: string): Promise<RequestAnalysis> {
  // Use Claude API to analyze request intent
  // Return structured analysis for routing
}
```

**Workflow States**:
```typescript
type WorkflowState =
  | 'analyzing'      // Orchestrator analyzing request
  | 'routing'        // Determining agent path
  | 'generating'     // CodeGen agent active
  | 'explaining'     // Explain agent active
  | 'validating'     // Quality checks
  | 'complete'       // Workflow finished
  | 'error';         // Error state

interface WorkflowStep {
  agent: 'orchestrator' | 'codeGen' | 'explain';
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
  metadata?: Record<string, any>;
}
```

**Implementation**:
```typescript
export class OrchestratorAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250929';
  private workflowHistory: WorkflowStep[] = [];

  async orchestrate(
    prompt: string,
    language: Language = 'en'
  ): Promise<OrchestratorResponse> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.orchestrator.systemPrompt;

    // Step 1: Analyze request
    this.addWorkflowStep('orchestrator', 'analyzing', 'in_progress');

    const analysis = await this.analyzeRequest(prompt, systemPrompt);

    this.addWorkflowStep('orchestrator', 'analyzing', 'completed');

    // Step 2: Determine workflow path
    const workflow = this.buildWorkflow(analysis);

    // Step 3: Return workflow plan
    return {
      intent: analysis.intent,
      complexity: analysis.complexity,
      workflow: workflow,
      estimatedTime: this.estimateTime(analysis),
      thinkingBudget: analysis.thinkingBudget
    };
  }

  private buildWorkflow(analysis: RequestAnalysis): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    if (analysis.requiredAgents.includes('codeGen')) {
      steps.push({
        agent: 'codeGen',
        action: 'generate_code',
        status: 'pending',
        timestamp: Date.now()
      });
    }

    if (analysis.requiredAgents.includes('explain')) {
      steps.push({
        agent: 'explain',
        action: 'explain_code',
        status: 'pending',
        timestamp: Date.now()
      });
    }

    return steps;
  }
}
```

### 2. CodeGen Agent

**Purpose**: Intelligent code generation with Extended Thinking

**Responsibilities**:
- Generate high-quality, production-ready code
- Detect and normalize programming languages
- Provide architectural reasoning
- Identify key decisions and trade-offs
- Suggest next steps and improvements

**Extended Thinking Integration**:
```typescript
export class CodeGenAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250929';
  private thinkingBudget = 10000; // tokens

  async generate(
    prompt: string,
    language: Language = 'en',
    context?: string
  ): Promise<CodeGenResponse> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.codeGen.systemPrompt;

    // Use Extended Thinking for complex analysis
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      thinking: {
        type: 'enabled',
        budget_tokens: this.thinkingBudget
      },
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract thinking process
    const thinking = this.extractThinking(message.content);

    // Parse structured response
    const response = this.parseResponse(message.content);

    return {
      thinking,
      ...response
    };
  }

  private extractThinking(content: any[]): string {
    for (const block of content) {
      if (block.type === 'thinking') {
        return block.thinking;
      }
    }
    return '';
  }

  private parseResponse(content: any[]): CodeGenResponse {
    let mainContent = '';
    for (const block of content) {
      if (block.type === 'text') {
        mainContent += block.text;
      }
    }

    // Extract structured sections
    const thinking = this.extractSection(mainContent, 'thinking');
    const code = this.extractSection(mainContent, 'code');
    const keyDecisions = this.extractList(mainContent, 'key_decisions');
    const nextSteps = this.extractList(mainContent, 'next_steps');

    // Intelligent language detection
    const language = this.detectLanguage(code);

    return {
      thinking,
      code: this.cleanCode(code),
      keyDecisions,
      nextSteps,
      language
    };
  }

  private detectLanguage(code: string): string {
    // 1. Extract from code fence
    const fenceMatch = code.match(/```(\w+)/);
    if (fenceMatch) {
      return this.normalizeLanguage(fenceMatch[1]);
    }

    // 2. Content-based detection
    const cleanCode = code.replace(/```\w*\n?|```/g, '').trim();

    // JavaScript patterns
    if (
      /\b(function|const|let|var|=>|async|await)\b/.test(cleanCode) ||
      /\bconsole\.(log|error|warn)/.test(cleanCode)
    ) {
      return 'javascript';
    }

    // Python patterns
    if (
      /\b(def|class|import|from|print)\b/.test(cleanCode) ||
      /:\s*$/m.test(cleanCode)
    ) {
      return 'python';
    }

    // TypeScript patterns
    if (
      /:\s*(string|number|boolean|any|void)/.test(cleanCode) ||
      /\binterface\s+\w+/.test(cleanCode)
    ) {
      return 'typescript';
    }

    return 'text';
  }

  private normalizeLanguage(lang: string): string {
    const normalized = lang.toLowerCase();
    const mappings: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'jsx': 'javascript',
      'tsx': 'typescript'
    };
    return mappings[normalized] || normalized;
  }
}
```

**Response Format**:
```typescript
interface CodeGenResponse {
  thinking: string;           // Extended thinking process
  code: string;               // Generated code
  keyDecisions: string[];     // Important architectural decisions
  nextSteps: string[];        // Suggested next steps
  language: string;           // Detected programming language
  metadata?: {
    complexity: 'simple' | 'moderate' | 'complex';
    patterns: string[];       // Design patterns used
    dependencies: string[];   // Required dependencies
  };
}
```

### 3. Explain Agent

**Purpose**: Deep code analysis and explanation

**Responsibilities**:
- Provide comprehensive code explanations
- Explain line-by-line on demand (fast, no Extended Thinking)
- Identify common mistakes and pitfalls
- Suggest optimizations and best practices
- Generate educational content

**Dual Mode Operation**:

**Full Explanation Mode** (with Extended Thinking):
```typescript
async explain(
  code: string,
  question: string,
  language: Language = 'en',
  programmingLanguage?: string
): Promise<ExplanationResponse> {
  const locale = loadLocale(language);
  const systemPrompt = locale.agents.explain.systemPrompt;

  // Use Extended Thinking for comprehensive analysis
  const message = await this.client.messages.create({
    model: this.model,
    max_tokens: 8000,
    system: systemPrompt,
    thinking: {
      type: 'enabled',
      budget_tokens: this.thinkingBudget
    },
    messages: [{
      role: 'user',
      content: `Programming Language: ${programmingLanguage}\n\nCode:\n\`\`\`\n${code}\n\`\`\`\n\n${question}`
    }]
  });

  return this.parseExplanation(message.content);
}
```

**Line Explanation Mode** (fast, no Extended Thinking):
```typescript
async explainLine(
  code: string,
  lineNumber: number,
  language: Language = 'en',
  programmingLanguage?: string
): Promise<LineExplanation> {
  const lines = code.split('\n');
  const targetLine = lines[lineNumber - 1];

  // Context: 3 lines before and after
  const start = Math.max(0, lineNumber - 4);
  const end = Math.min(lines.length, lineNumber + 3);
  const context = lines.slice(start, end).join('\n');

  // Fast response without Extended Thinking
  const message = await this.client.messages.create({
    model: this.model,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Code Context:\n\`\`\`\n${context}\n\`\`\`\n\nBriefly explain line ${lineNumber}: "${targetLine}"`
    }]
  });

  let explanation = '';
  for (const block of message.content) {
    if (block.type === 'text') {
      explanation += block.text;
    }
  }

  return {
    explanation,
    thinking: ''
  };
}
```

## MCP Server Integration

### MCP Server Architecture

```typescript
interface MCPServerConfig {
  name: string;
  enabled: boolean;
  endpoint?: string;
  capabilities: string[];
  priority: number;
}

class MCPIntegrationService {
  private servers: Map<string, MCPServerConfig> = new Map();

  constructor() {
    this.initializeServers();
  }

  private initializeServers() {
    // Context7 - Documentation lookup
    this.servers.set('context7', {
      name: 'Context7',
      enabled: true,
      capabilities: ['documentation', 'library-info', 'best-practices'],
      priority: 1
    });

    // Sequential - Multi-step analysis
    this.servers.set('sequential', {
      name: 'Sequential Thinking',
      enabled: true,
      capabilities: ['complex-analysis', 'debugging', 'architecture-review'],
      priority: 2
    });

    // Playwright - Browser automation
    this.servers.set('playwright', {
      name: 'Playwright',
      enabled: true,
      capabilities: ['e2e-testing', 'performance-testing', 'visual-testing'],
      priority: 3
    });
  }

  async queryServer(
    serverName: string,
    query: string,
    context?: any
  ): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server || !server.enabled) {
      throw new Error(`MCP Server ${serverName} not available`);
    }

    // Implementation depends on MCP protocol
    // This is a placeholder for actual MCP communication
    return this.executeMCPQuery(server, query, context);
  }
}
```

### Context7 Integration (Documentation)

**Use Cases**:
- Library documentation lookup
- Framework best practices
- Code examples and patterns
- API reference

**Implementation**:
```typescript
class Context7Service {
  async getLibraryDocs(
    libraryName: string,
    topic?: string
  ): Promise<DocumentationResponse> {
    // Step 1: Resolve library ID
    const libraryId = await this.resolveLibraryId(libraryName);

    // Step 2: Fetch documentation
    const docs = await this.fetchDocs(libraryId, topic);

    return {
      library: libraryName,
      version: docs.version,
      content: docs.content,
      examples: docs.examples,
      relatedTopics: docs.related
    };
  }

  private async resolveLibraryId(name: string): Promise<string> {
    // Use Context7 MCP to resolve library name to canonical ID
    return `npm:${name}`;
  }

  private async fetchDocs(
    libraryId: string,
    topic?: string
  ): Promise<any> {
    // Fetch from Context7 MCP server
    return {
      version: 'latest',
      content: '...',
      examples: [],
      related: []
    };
  }
}
```

### Sequential Integration (Complex Analysis)

**Use Cases**:
- Multi-step debugging
- Architectural analysis
- Performance optimization
- Security auditing

**Implementation**:
```typescript
class SequentialService {
  async analyzeCodebase(
    code: string,
    analysisType: 'performance' | 'security' | 'architecture'
  ): Promise<AnalysisResponse> {
    const steps: AnalysisStep[] = [];

    // Step 1: Parse and understand structure
    steps.push({
      phase: 'parsing',
      status: 'in_progress',
      findings: []
    });

    // Step 2: Identify patterns and anti-patterns
    steps.push({
      phase: 'pattern_detection',
      status: 'pending',
      findings: []
    });

    // Step 3: Generate recommendations
    steps.push({
      phase: 'recommendations',
      status: 'pending',
      findings: []
    });

    // Execute sequential analysis via MCP
    return this.executeSequentialAnalysis(steps, code, analysisType);
  }

  private async executeSequentialAnalysis(
    steps: AnalysisStep[],
    code: string,
    type: string
  ): Promise<AnalysisResponse> {
    const results: AnalysisFinding[] = [];

    for (const step of steps) {
      step.status = 'in_progress';

      // Execute step via Sequential MCP server
      const findings = await this.executeStep(step, code, type);

      step.findings = findings;
      step.status = 'completed';
      results.push(...findings);
    }

    return {
      type,
      steps,
      findings: results,
      summary: this.generateSummary(results)
    };
  }
}
```

### Playwright Integration (Testing)

**Use Cases**:
- E2E test generation
- Visual regression testing
- Performance monitoring
- Accessibility testing

**Implementation**:
```typescript
class PlaywrightService {
  async generateE2ETest(
    code: string,
    userFlow: string
  ): Promise<TestGenerationResponse> {
    return {
      testCode: this.generateTestCode(userFlow),
      commands: this.extractCommands(userFlow),
      assertions: this.generateAssertions(userFlow)
    };
  }

  async runPerformanceTest(
    url: string,
    scenario: PerformanceScenario
  ): Promise<PerformanceReport> {
    // Use Playwright MCP to run performance tests
    return {
      metrics: {
        loadTime: 0,
        firstContentfulPaint: 0,
        timeToInteractive: 0,
        totalBlockingTime: 0
      },
      screenshots: [],
      recommendations: []
    };
  }
}
```

## Workflow Management

### Workflow Engine

```typescript
class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private currentWorkflow?: Workflow;

  async startWorkflow(
    type: WorkflowType,
    input: WorkflowInput
  ): Promise<string> {
    const workflowId = this.generateWorkflowId();

    const workflow: Workflow = {
      id: workflowId,
      type,
      status: 'running',
      steps: this.buildSteps(type, input),
      input,
      output: null,
      startTime: Date.now(),
      endTime: null
    };

    this.workflows.set(workflowId, workflow);
    this.currentWorkflow = workflow;

    // Execute workflow asynchronously
    this.executeWorkflow(workflow);

    return workflowId;
  }

  private buildSteps(
    type: WorkflowType,
    input: WorkflowInput
  ): WorkflowStep[] {
    switch (type) {
      case 'code_generation':
        return [
          { agent: 'orchestrator', action: 'analyze', status: 'pending' },
          { agent: 'codeGen', action: 'generate', status: 'pending' },
          { agent: 'explain', action: 'explain', status: 'pending' }
        ];

      case 'code_explanation':
        return [
          { agent: 'orchestrator', action: 'analyze', status: 'pending' },
          { agent: 'explain', action: 'explain', status: 'pending' }
        ];

      case 'code_execution':
        return [
          { agent: 'playground', action: 'execute', status: 'pending' }
        ];

      default:
        return [];
    }
  }

  private async executeWorkflow(workflow: Workflow): Promise<void> {
    for (const step of workflow.steps) {
      step.status = 'in_progress';
      step.startTime = Date.now();

      try {
        const result = await this.executeStep(workflow, step);
        step.output = result;
        step.status = 'completed';
        step.endTime = Date.now();

        // Emit progress event
        this.emitProgress(workflow, step);
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.endTime = Date.now();

        // Handle error recovery
        await this.handleStepFailure(workflow, step, error);
        break;
      }
    }

    workflow.status = workflow.steps.every(s => s.status === 'completed')
      ? 'completed'
      : 'failed';
    workflow.endTime = Date.now();

    this.emitCompletion(workflow);
  }

  private async executeStep(
    workflow: Workflow,
    step: WorkflowStep
  ): Promise<any> {
    switch (step.agent) {
      case 'orchestrator':
        return this.executeOrchestrator(workflow, step);
      case 'codeGen':
        return this.executeCodeGen(workflow, step);
      case 'explain':
        return this.executeExplain(workflow, step);
      case 'playground':
        return this.executePlayground(workflow, step);
      default:
        throw new Error(`Unknown agent: ${step.agent}`);
    }
  }
}
```

### Workflow Types

```typescript
type WorkflowType =
  | 'code_generation'      // Generate code from prompt
  | 'code_explanation'     // Explain existing code
  | 'code_execution'       // Execute code
  | 'line_explanation'     // Explain specific line
  | 'test_generation'      // Generate tests
  | 'performance_analysis' // Analyze performance
  | 'security_audit';      // Security analysis

interface Workflow {
  id: string;
  type: WorkflowType;
  status: 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  input: WorkflowInput;
  output: any | null;
  startTime: number;
  endTime: number | null;
  metadata?: {
    tokensUsed?: number;
    thinkingTokens?: number;
    mcpServersUsed?: string[];
  };
}

interface WorkflowInput {
  prompt?: string;
  code?: string;
  lineNumber?: number;
  language?: Language;
  programmingLanguage?: string;
  context?: any;
}
```

### Error Recovery Strategy

```typescript
class ErrorRecoveryService {
  async handleStepFailure(
    workflow: Workflow,
    failedStep: WorkflowStep,
    error: Error
  ): Promise<void> {
    // Log error details
    console.error(`Workflow ${workflow.id} step failed:`, {
      step: failedStep.action,
      agent: failedStep.agent,
      error: error.message
    });

    // Attempt recovery based on error type
    if (this.isRetryable(error)) {
      await this.retryStep(workflow, failedStep);
    } else if (this.hasFallback(failedStep)) {
      await this.executeFallback(workflow, failedStep);
    } else {
      // Mark workflow as failed
      workflow.status = 'failed';
      this.emitError(workflow, error);
    }
  }

  private isRetryable(error: Error): boolean {
    // Network errors, rate limits, temporary failures
    return /timeout|network|rate limit/i.test(error.message);
  }

  private hasFallback(step: WorkflowStep): boolean {
    // Check if step has alternative execution path
    return ['codeGen', 'explain'].includes(step.agent);
  }

  private async retryStep(
    workflow: Workflow,
    step: WorkflowStep,
    maxRetries: number = 3
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.executeStep(workflow, step);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(1000 * (i + 1)); // Exponential backoff
      }
    }
  }

  private async executeFallback(
    workflow: Workflow,
    step: WorkflowStep
  ): Promise<void> {
    // Use simpler model or cached response
    step.metadata = { ...step.metadata, fallback: true };

    // Execute with reduced parameters
    await this.executeStepWithFallback(workflow, step);
  }
}
```

## Streaming Architecture

### Server-Sent Events (SSE) Implementation

```typescript
// Backend streaming endpoint
router.post('/api/generate', async (req: Request, res: Response) => {
  const { prompt, language } = req.body;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Step 1: Orchestrator analysis
    const workflow = await orchestrator.orchestrate(prompt, language);
    res.write(`data: ${JSON.stringify({ type: 'workflow', data: workflow })}\n\n`);

    // Step 2: Stream code generation
    for await (const chunk of codeGen.generateStream(prompt, language)) {
      res.write(`data: ${JSON.stringify({ type: 'code', chunk })}\n\n`);
    }

    // Step 3: Get explanation
    const code = await codeGen.generate(prompt, language);
    const explanation = await explain.explain(
      code.code,
      'Explain this code in detail',
      language,
      code.language
    );

    res.write(`data: ${JSON.stringify({ type: 'explanation', data: explanation })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});
```

### Frontend Streaming Handler

```typescript
async function handleGenerate() {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, language })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;

      const data = JSON.parse(line.slice(6));

      switch (data.type) {
        case 'workflow':
          setWorkflow(data.data);
          break;
        case 'code':
          setCodeChunk(prev => prev + data.chunk);
          break;
        case 'explanation':
          setExplanation(data.data);
          break;
        case 'complete':
          setIsGenerating(false);
          break;
        case 'error':
          setError(data.error);
          break;
      }
    }
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl = 3600000; // 1 hour

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  generateKey(type: string, params: any): string {
    return `${type}:${JSON.stringify(params)}`;
  }
}
```

### Request Batching

```typescript
class BatchingService {
  private queue: BatchRequest[] = [];
  private processing = false;
  private batchSize = 5;
  private batchDelay = 100; // ms

  async addRequest(request: BatchRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing() {
    if (this.processing) return;

    setTimeout(() => this.processBatch(), this.batchDelay);
  }

  private async processBatch() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(req => this.executeRequest(req))
    );

    // Resolve/reject promises
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        batch[i].resolve(result.value);
      } else {
        batch[i].reject(result.reason);
      }
    });

    // Continue processing
    this.scheduleProcessing();
  }
}
```

## Security Implementation

### Input Validation

```typescript
class ValidationService {
  validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];

    // Length check
    if (prompt.length < 10) {
      errors.push('Prompt too short (minimum 10 characters)');
    }
    if (prompt.length > 10000) {
      errors.push('Prompt too long (maximum 10000 characters)');
    }

    // Injection detection
    if (this.containsMaliciousPatterns(prompt)) {
      errors.push('Prompt contains potentially malicious content');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private containsMaliciousPatterns(text: string): boolean {
    const maliciousPatterns = [
      /<script\b[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /__import__/i
    ];

    return maliciousPatterns.some(pattern => pattern.test(text));
  }
}
```

### Code Execution Sandbox

```typescript
class SecureSandbox {
  execute(code: string, language: string): ExecutionResult {
    const sandbox = this.createSandbox(language);
    const timeout = 5000; // 5 seconds

    try {
      const result = this.executeInSandbox(code, sandbox, timeout);
      return {
        success: true,
        output: result.output,
        executionTime: result.executionTime
      };
    } catch (error) {
      return {
        success: false,
        error: this.sanitizeError(error)
      };
    }
  }

  private createSandbox(language: string): Sandbox {
    const baseContext = {
      console: this.createSecureConsole(),
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date
    };

    // Remove dangerous globals
    const sandbox = {
      ...baseContext,
      // Explicitly undefined
      require: undefined,
      process: undefined,
      global: undefined,
      __dirname: undefined,
      __filename: undefined
    };

    return sandbox;
  }

  private createSecureConsole(): Console {
    const output: string[] = [];
    const timeLabels = new Map<string, number>();

    return {
      log: (...args: any[]) => {
        output.push(args.map(String).join(' '));
      },
      error: (...args: any[]) => {
        output.push('ERROR: ' + args.map(String).join(' '));
      },
      warn: (...args: any[]) => {
        output.push('WARN: ' + args.map(String).join(' '));
      },
      time: (label: string = 'default') => {
        timeLabels.set(label, Date.now());
      },
      timeEnd: (label: string = 'default') => {
        const start = timeLabels.get(label);
        if (start) {
          const duration = Date.now() - start;
          output.push(`${label}: ${duration}ms`);
          timeLabels.delete(label);
        }
      },
      clear: () => { output.length = 0; }
    };
  }
}
```

## Monitoring and Analytics

### Performance Monitoring

```typescript
class MonitoringService {
  private metrics: Map<string, Metric> = new Map();

  trackRequest(endpoint: string, duration: number) {
    const key = `request:${endpoint}`;
    const metric = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0
    };

    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);

    this.metrics.set(key, metric);
  }

  trackTokenUsage(agent: string, tokens: number) {
    const key = `tokens:${agent}`;
    const metric = this.metrics.get(key) || {
      totalTokens: 0,
      requests: 0
    };

    metric.totalTokens += tokens;
    metric.requests++;

    this.metrics.set(key, metric);
  }

  getMetrics(): MetricsReport {
    const report: MetricsReport = {
      requests: {},
      tokens: {},
      timestamp: Date.now()
    };

    for (const [key, metric] of this.metrics) {
      if (key.startsWith('request:')) {
        const endpoint = key.slice(8);
        report.requests[endpoint] = {
          count: metric.count,
          avgDuration: metric.totalDuration / metric.count,
          minDuration: metric.minDuration,
          maxDuration: metric.maxDuration
        };
      } else if (key.startsWith('tokens:')) {
        const agent = key.slice(7);
        report.tokens[agent] = {
          total: metric.totalTokens,
          average: metric.totalTokens / metric.requests
        };
      }
    }

    return report;
  }
}
```

## Deployment Strategy

### Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - EXTENDED_THINKING_BUDGET=10000
      - NODE_ENV=production
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

## Testing Strategy

### Unit Tests

```typescript
describe('CodeGenAgent', () => {
  let agent: CodeGenAgent;

  beforeEach(() => {
    agent = new CodeGenAgent(process.env.ANTHROPIC_API_KEY!);
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript from code fence', () => {
      const code = '```javascript\nconst x = 1;\n```';
      expect(agent.detectLanguage(code)).toBe('javascript');
    });

    it('should detect JavaScript from content', () => {
      const code = 'const x = 1;\nfunction foo() {}';
      expect(agent.detectLanguage(code)).toBe('javascript');
    });

    it('should detect Python from content', () => {
      const code = 'def foo():\n    print("hello")';
      expect(agent.detectLanguage(code)).toBe('python');
    });
  });
});
```

### Integration Tests

```typescript
describe('Workflow Integration', () => {
  it('should complete code generation workflow', async () => {
    const workflow = await workflowEngine.startWorkflow(
      'code_generation',
      { prompt: 'Create a Fibonacci function' }
    );

    expect(workflow.id).toBeDefined();
    expect(workflow.status).toBe('running');

    // Wait for completion
    await waitForWorkflow(workflow.id);

    const completed = await workflowEngine.getWorkflow(workflow.id);
    expect(completed.status).toBe('completed');
    expect(completed.output).toBeDefined();
    expect(completed.output.code).toContain('function');
  });
});
```

### E2E Tests with Playwright

```typescript
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');

  // Enter prompt
  await page.fill('textarea[placeholder*="Ask Claude"]',
    'Create a Fibonacci sequence generator');

  // Click generate
  await page.click('button:has-text("Generate")');

  // Wait for code to appear
  await expect(page.locator('.monaco-editor')).toBeVisible();

  // Click run button
  await page.click('button:has-text("Run")');

  // Verify execution results
  await expect(page.locator('.execution-result')).toContainText('Success');

  // Save to Notion
  await page.click('button:has-text("Save to Notion")');
  await expect(page.locator('.notification')).toContainText('Saved');
});
```

## Summary: Complete Implementation Checklist

- [ ] Multi-agent orchestration system
- [ ] Extended Thinking integration (10K token budget)
- [ ] Intelligent language detection
- [ ] MCP server integration (Context7, Sequential, Playwright)
- [ ] Workflow management engine
- [ ] Real-time streaming with SSE
- [ ] Secure code execution sandbox
- [ ] Line-by-line explanation
- [ ] Notion integration
- [ ] i18n support (English/Korean)
- [ ] Performance monitoring
- [ ] Error recovery system
- [ ] Caching layer
- [ ] Docker deployment
- [ ] Comprehensive testing
- [ ] Security validation

Build this system incrementally, testing each component thoroughly before integration.
