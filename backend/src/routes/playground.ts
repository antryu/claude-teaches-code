import { Router, Request, Response } from 'express';

export function createPlaygroundRouter(): Router {
  const router = Router();

  /**
   * POST /api/playground/execute
   * JavaScript 코드 실행
   */
  router.post('/playground/execute', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required',
        });
      }

      // 직접 실행 (MCP 없이)
      const startTime = Date.now();
      const output: string[] = [];

      const consoleLog = (...args: any[]) => {
        output.push(args.map(String).join(' '));
      };

      const timeLabels = new Map<string, number>();

      const sandbox = {
        console: {
          log: consoleLog,
          error: consoleLog,
          warn: consoleLog,
          info: consoleLog,
          time: (label: string = 'default') => {
            timeLabels.set(label, Date.now());
          },
          timeEnd: (label: string = 'default') => {
            const start = timeLabels.get(label);
            if (start) {
              const duration = Date.now() - start;
              consoleLog(`${label}: ${duration}ms`);
              timeLabels.delete(label);
            }
          },
          clear: () => {},
        },
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
      };

      const fn = new Function(...Object.keys(sandbox), `'use strict';\n${code}`);
      fn(...Object.values(sandbox));

      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          success: true,
          output: output.length > 0 ? output.join('\n') : '(실행 완료 - 출력 없음)',
          executionTime,
        },
      });
    } catch (error) {
      console.error('Execute error:', error);
      res.json({
        success: true,
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  });

  /**
   * POST /api/playground/compare
   * 여러 코드 비교
   */
  router.post('/playground/compare', async (req: Request, res: Response) => {
    try {
      const { codes, labels } = req.body;

      if (!codes || !labels || codes.length !== labels.length) {
        return res.status(400).json({
          success: false,
          error: 'codes and labels are required and must have same length',
        });
      }

      const result = await mcpIntegration.executeTool('compare_outputs', { codes, labels });
      const parsed = JSON.parse(result);

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      console.error('Compare error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/playground/explain-error
   * 에러 설명
   */
  router.post('/playground/explain-error', async (req: Request, res: Response) => {
    try {
      const { error, code } = req.body;

      if (!error) {
        return res.status(400).json({
          success: false,
          error: 'Error message is required',
        });
      }

      const result = await mcpIntegration.executeTool('explain_error', { error, code });
      const parsed = JSON.parse(result);

      res.json({
        success: true,
        data: parsed,
      });
    } catch (err) {
      console.error('Explain error:', err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/playground/measure
   * 성능 측정
   */
  router.post('/playground/measure', async (req: Request, res: Response) => {
    try {
      const { code, iterations = 1000 } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Code is required',
        });
      }

      // 직접 성능 측정 (MCP 없이)
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        try {
          const output: string[] = [];
          const consoleLog = (...args: any[]) => {
            output.push(args.map(String).join(' '));
          };

          const timeLabels = new Map<string, number>();

          const sandbox = {
            console: {
              log: consoleLog,
              error: consoleLog,
              warn: consoleLog,
              info: consoleLog,
              time: (label: string = 'default') => {
                timeLabels.set(label, Date.now());
              },
              timeEnd: (label: string = 'default') => {
                const start = timeLabels.get(label);
                if (start) {
                  const duration = Date.now() - start;
                  consoleLog(`${label}: ${duration}ms`);
                  timeLabels.delete(label);
                }
              },
              clear: () => {},
            },
            Math,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            Date,
          };

          const fn = new Function(...Object.keys(sandbox), `'use strict';\n${code}`);
          fn(...Object.values(sandbox));
        } catch (error) {
          // 에러 무시하고 계속
        }

        const executionTime = Date.now() - startTime;
        times.push(executionTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const totalTime = times.reduce((a, b) => a + b, 0);

      res.json({
        success: true,
        data: {
          iterations,
          averageTime,
          minTime,
          maxTime,
          totalTime,
        },
      });
    } catch (error) {
      console.error('Measure error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
