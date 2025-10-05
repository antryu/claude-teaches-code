export type Language = 'en' | 'ko';

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

export interface GeneratedCode {
  code: string;
  language: string;
  thinking: string;
  keyDecisions: string[];
  nextSteps: string[];
}

export interface LineExplanation {
  lineNumber: number;
  explanation: ExplanationResponse;
}
