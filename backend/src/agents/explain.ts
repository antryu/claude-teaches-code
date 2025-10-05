import Anthropic from '@anthropic-ai/sdk';
import { Language, ExplanationResponse } from '../types';
import { loadLocale } from '../utils/locale';
import { mcpIntegration } from '../services/mcpIntegration';

export class ExplainAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250929';
  private thinkingBudget: number;
  private useMCP: boolean;

  constructor(apiKey: string, thinkingBudget: number = 10000, useMCP: boolean = true) {
    this.client = new Anthropic({ apiKey });
    this.thinkingBudget = thinkingBudget;
    this.useMCP = useMCP;
  }

  async explain(
    code: string,
    question: string,
    language: Language = 'en',
    programmingLanguage?: string
  ): Promise<ExplanationResponse> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.explain.systemPrompt;

    const langContext = programmingLanguage
      ? `Programming Language: ${programmingLanguage}\n\n`
      : '';

    const tools = this.useMCP ? mcpIntegration.getToolsForClaude() : [];

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: this.thinkingBudget + 8000,
      system: systemPrompt,
      thinking: {
        type: 'enabled',
        budget_tokens: this.thinkingBudget
      },
      tools: tools.length > 0 ? tools : undefined,
      messages: [
        {
          role: 'user',
          content: `${langContext}Code:\n\`\`\`\n${code}\n\`\`\`\n\nQuestion: ${question}`
        }
      ]
    });

    // Tool use 처리
    if (message.stop_reason === 'tool_use') {
      return await this.handleToolUse(message, code, question, language, programmingLanguage);
    }

    let thinking = '';
    let extendedThinking = '';
    let mainContent = '';

    for (const block of message.content) {
      if (block.type === 'thinking') {
        extendedThinking = block.thinking;
      } else if (block.type === 'text') {
        mainContent = block.text;
      }
    }

    return this.parseResponse(mainContent, thinking, extendedThinking);
  }

  private async handleToolUse(
    message: Anthropic.Message,
    code: string,
    question: string,
    language: Language,
    programmingLanguage?: string
  ): Promise<ExplanationResponse> {
    const toolUseBlocks = message.content.filter((block) => block.type === 'tool_use');
    const toolResults: any[] = [];

    // 모든 도구 호출 실행
    for (const toolBlock of toolUseBlocks) {
      if (toolBlock.type !== 'tool_use') continue;

      const result = await mcpIntegration.executeTool(toolBlock.name, toolBlock.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    // 도구 결과와 함께 다시 Claude 호출
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.explain.systemPrompt;
    const langContext = programmingLanguage
      ? `Programming Language: ${programmingLanguage}\n\n`
      : '';

    const followUp = await this.client.messages.create({
      model: this.model,
      max_tokens: this.thinkingBudget + 8000,
      system: systemPrompt,
      thinking: {
        type: 'enabled',
        budget_tokens: this.thinkingBudget
      },
      messages: [
        {
          role: 'user',
          content: `${langContext}Code:\n\`\`\`\n${code}\n\`\`\`\n\nQuestion: ${question}`
        },
        {
          role: 'assistant',
          content: message.content,
        },
        {
          role: 'user',
          content: toolResults,
        },
      ],
    });

    let thinking = '';
    let extendedThinking = '';
    let mainContent = '';

    for (const block of followUp.content) {
      if (block.type === 'thinking') {
        extendedThinking = block.thinking;
      } else if (block.type === 'text') {
        mainContent = block.text;
      }
    }

    return this.parseResponse(mainContent, thinking, extendedThinking);
  }

  async explainLine(
    code: string,
    lineNumber: number,
    language: Language = 'en',
    programmingLanguage?: string
  ): Promise<ExplanationResponse> {
    const lines = code.split('\n');
    const targetLine = lines[lineNumber - 1];
    const context = lines.slice(Math.max(0, lineNumber - 3), Math.min(lines.length, lineNumber + 2)).join('\n');

    const locale = loadLocale(language);
    const systemPrompt = locale.agents.explain.systemPrompt;
    const langContext = programmingLanguage
      ? `Programming Language: ${programmingLanguage}\n\n`
      : '';

    // 라인 설명은 빠르게 - Extended Thinking 없이
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000, // 짧게
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `${langContext}Code Context:\n\`\`\`\n${context}\n\`\`\`\n\nBriefly explain line ${lineNumber}: "${targetLine}"\n\nProvide a concise explanation focusing on what this line does.`
        }
      ]
    });

    let mainContent = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        mainContent += block.text;
      }
    }

    return this.parseExplanation(mainContent, '');
  }

  async *explainStream(
    code: string,
    question: string,
    language: Language = 'en',
    programmingLanguage?: string
  ): AsyncGenerator<{ type: 'thinking' | 'text'; content: string }, void, unknown> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.explain.systemPrompt;

    const langContext = programmingLanguage
      ? `Programming Language: ${programmingLanguage}\n\n`
      : '';

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: this.thinkingBudget + 8000,
      system: systemPrompt,
      thinking: {
        type: 'enabled',
        budget_tokens: this.thinkingBudget
      },
      messages: [
        {
          role: 'user',
          content: `${langContext}Code:\n\`\`\`\n${code}\n\`\`\`\n\nQuestion: ${question}`
        }
      ]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta.type === 'thinking_delta') {
          yield { type: 'thinking', content: chunk.delta.thinking };
        } else if (chunk.delta.type === 'text_delta') {
          yield { type: 'text', content: chunk.delta.text };
        }
      }
    }
  }

  private parseResponse(
    text: string,
    thinking: string,
    extendedThinking: string
  ): ExplanationResponse {
    const explanation = this.extractSection(text, 'explanation') || text;
    const keyConcepts = this.extractList(text, 'key_concepts');
    const commonMistakes = this.extractList(text, 'common_mistakes');

    return {
      thinking: this.extractSection(text, 'thinking') || thinking,
      explanation,
      keyConcepts,
      commonMistakes,
      extendedThinking: extendedThinking || undefined
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
