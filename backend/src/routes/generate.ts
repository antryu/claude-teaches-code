import { Router, Request, Response } from 'express';
import { OrchestratorAgent } from '../agents/orchestrator';
import { CodeGenAgent } from '../agents/codeGen';
import { ExplainAgent } from '../agents/explain';
import { GenerateRequest, SSEMessage, Language } from '../types';

export function createGenerateRouter(
  orchestrator: OrchestratorAgent,
  codeGen: CodeGenAgent,
  explain: ExplainAgent
) {
  const router = Router();

  router.post('/generate', async (req: Request, res: Response) => {
    const { prompt, language = 'en', context }: GenerateRequest = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendSSE = (message: SSEMessage) => {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    };

    try {
      // Step 1: Orchestrator analyzes intent
      sendSSE({
        type: 'workflow',
        data: { step: 'analyzing', agent: 'Orchestrator' },
        agent: 'Orchestrator'
      });

      const workflow = await orchestrator.analyze(prompt, language as Language);

      sendSSE({
        type: 'workflow',
        data: workflow,
        agent: 'Orchestrator'
      });

      // Step 2: Execute workflow
      if (workflow.intent === 'generate' || workflow.intent === 'review') {
        sendSSE({
          type: 'workflow',
          data: { step: 'generating', agent: 'CodeGenAgent' },
          agent: 'CodeGenAgent'
        });

        let fullResponse = '';

        for await (const chunk of codeGen.generateStream(prompt, language as Language, context)) {
          fullResponse += chunk;
          sendSSE({
            type: 'code',
            data: { chunk, fullResponse },
            agent: 'CodeGenAgent'
          });
        }

        const codeResponse = await codeGen.generate(prompt, language as Language, context);

        sendSSE({
          type: 'code',
          data: codeResponse,
          agent: 'CodeGenAgent'
        });
      }

      if (workflow.intent === 'explain' || workflow.agents.includes('ExplainAgent')) {
        sendSSE({
          type: 'workflow',
          data: { step: 'explaining', agent: 'ExplainAgent' },
          agent: 'ExplainAgent'
        });

        const codeToExplain = context || '';

        for await (const chunk of explain.explainStream(codeToExplain, prompt, language as Language)) {
          sendSSE({
            type: chunk.type === 'thinking' ? 'thinking' : 'explanation',
            data: { chunk: chunk.content },
            agent: 'ExplainAgent'
          });
        }

        const explanationResponse = await explain.explain(codeToExplain, prompt, language as Language);

        sendSSE({
          type: 'explanation',
          data: explanationResponse,
          agent: 'ExplainAgent'
        });
      }

      sendSSE({
        type: 'complete',
        data: { success: true }
      });

      res.end();
    } catch (error) {
      sendSSE({
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
          error: true
        }
      });
      res.end();
    }
  });

  return router;
}
