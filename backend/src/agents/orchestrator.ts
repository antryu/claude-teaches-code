import Anthropic from '@anthropic-ai/sdk';
import { Language, OrchestratorResponse } from '../types';
import { loadLocale } from '../utils/locale';

export class OrchestratorAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5-20250929';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(prompt: string, language: Language = 'en'): Promise<OrchestratorResponse> {
    const locale = loadLocale(language);
    const systemPrompt = locale.agents.orchestrator.systemPrompt;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this request and provide a workflow plan in JSON format:

User Request: ${prompt}

Required JSON format:
{
  "intent": "generate" | "explain" | "review" | "alternatives",
  "agents": ["CodeGenAgent" | "ExplainAgent"],
  "workflow": [
    {
      "agent": "agent_name",
      "action": "action_description",
      "description": "detailed_description"
    }
  ],
  "reasoning": "why_this_workflow"
}`
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Orchestrator');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in orchestrator response');
    }

    const response = JSON.parse(jsonMatch[0]) as OrchestratorResponse;
    return response;
  }
}
