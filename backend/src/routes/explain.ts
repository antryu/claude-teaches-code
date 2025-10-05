import { Router, Request, Response } from 'express';
import { ExplainAgent } from '../agents/explain';
import { ExplainLineRequest, AlternativesRequest, Language } from '../types';

export function createExplainRouter(explain: ExplainAgent) {
  const router = Router();

  router.post('/explain-line', async (req: Request, res: Response) => {
    const {
      code,
      lineNumber,
      language = 'en',
      programmingLanguage
    }: ExplainLineRequest = req.body;

    console.log('📝 Explain line request:', { lineNumber, programmingLanguage, codeLength: code?.length });

    if (!code || !lineNumber) {
      console.error('❌ Missing required fields:', { hasCode: !!code, hasLineNumber: !!lineNumber });
      return res.status(400).json({ error: 'Code and lineNumber are required' });
    }

    try {
      const explanation = await explain.explainLine(
        code,
        lineNumber,
        language as Language,
        programmingLanguage
      );

      console.log('✅ Explanation generated successfully');
      res.json({
        success: true,
        data: explanation
      });
    } catch (error) {
      console.error('❌ Error in explain-line:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/alternatives', async (req: Request, res: Response) => {
    const {
      code,
      language = 'en',
      programmingLanguage
    }: AlternativesRequest = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    try {
      const alternatives = await explain.explain(
        code,
        'Suggest alternative implementations of this code with pros and cons for each approach.',
        language as Language,
        programmingLanguage
      );

      res.json({
        success: true,
        data: alternatives
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
