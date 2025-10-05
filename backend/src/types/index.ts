export type Language = 'en' | 'ko';

export interface GenerateRequest {
  prompt: string;
  language?: Language;
  context?: string;
}

export interface ExplainLineRequest {
  code: string;
  lineNumber: number;
  language?: Language;
  programmingLanguage?: string;
}

export interface AlternativesRequest {
  code: string;
  language?: Language;
  programmingLanguage?: string;
}

export interface WorkflowStep {
  agent: string;
  action: string;
  description: string;
}

export interface OrchestratorResponse {
  intent: 'generate' | 'explain' | 'review' | 'alternatives';
  agents: string[];
  workflow: WorkflowStep[];
  reasoning?: string;
}

export interface CodeGenResponse {
  thinking: string;
  code: string;
  keyDecisions: string[];
  nextSteps: string[];
  language: string;
}

export interface ExplanationResponse {
  thinking: string;
  explanation: string;
  keyConcepts: string[];
  commonMistakes: string[];
  extendedThinking?: string;
}

export interface SSEMessage {
  type: 'workflow' | 'thinking' | 'code' | 'explanation' | 'complete' | 'error';
  data: any;
  agent?: string;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
}
