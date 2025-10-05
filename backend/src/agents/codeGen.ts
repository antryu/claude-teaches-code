import Anthropic from '@anthropic-ai/sdk';
import { Language, CodeGenResponse } from '../types';
import { loadLocale } from '../utils/locale';

export class CodeGenAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250929';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(
    prompt: string,
    language: Language = 'en',
    context?: string
  ): Promise<CodeGenResponse> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.codeGen.systemPrompt;

    const userMessage = context
      ? `Context: ${context}\n\nRequest: ${prompt}`
      : prompt;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from CodeGen');
    }

    return this.parseResponse(content.text);
  }

  async *generateStream(
    prompt: string,
    language: Language = 'en',
    context?: string
  ): AsyncGenerator<string, void, unknown> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.codeGen.systemPrompt;

    const userMessage = context
      ? `Context: ${context}\n\nRequest: ${prompt}`
      : prompt;

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  private parseResponse(text: string): CodeGenResponse {
    const thinking = this.extractSection(text, 'thinking');
    const code = this.extractSection(text, 'code');
    const keyDecisions = this.extractList(text, 'key_decisions');
    const nextSteps = this.extractList(text, 'next_steps');

    // Detect programming language from code block
    const langMatch = code.match(/```(\w+)/);
    let detectedLanguage = langMatch ? langMatch[1].toLowerCase() : 'text';

    // Normalize language names
    if (detectedLanguage === 'js') detectedLanguage = 'javascript';
    if (detectedLanguage === 'py') detectedLanguage = 'python';
    if (detectedLanguage === 'ts') detectedLanguage = 'typescript';

    // If still 'text', try to infer from content
    if (detectedLanguage === 'text') {
      const cleanCode = code.replace(/```\w*\n?|```/g, '').trim();
      if (cleanCode.includes('function') || cleanCode.includes('const') || cleanCode.includes('let') || cleanCode.includes('=>')) {
        detectedLanguage = 'javascript';
      } else if (cleanCode.includes('def ') || cleanCode.includes('import ') || cleanCode.includes('print(')) {
        detectedLanguage = 'python';
      }
    }

    return {
      thinking,
      code: code.replace(/```\w*\n?|```/g, '').trim(),
      keyDecisions,
      nextSteps,
      language: detectedLanguage
    };
  }

  private extractSection(text: string, tag: string): string {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractList(text: string, tag: string): string[] {
    const section = this.extractSection(text, tag);
    if (!section) return [];

    return section
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
}
