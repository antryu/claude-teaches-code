import { Language, SSEMessage, ExplanationResponse } from '../types';

const API_BASE = '/api';

export async function* generateCodeStream(
  prompt: string,
  language: Language = 'en',
  context?: string
): AsyncGenerator<SSEMessage, void, unknown> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, language, context }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            const message: SSEMessage = JSON.parse(data);
            yield message;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function explainLine(
  code: string,
  lineNumber: number,
  language: Language = 'en',
  programmingLanguage?: string
): Promise<ExplanationResponse> {
  const response = await fetch(`${API_BASE}/explain-line`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, lineNumber, language, programmingLanguage }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function getAlternatives(
  code: string,
  language: Language = 'en',
  programmingLanguage?: string
): Promise<ExplanationResponse> {
  const response = await fetch(`${API_BASE}/alternatives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, language, programmingLanguage }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function checkHealth(): Promise<any> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
