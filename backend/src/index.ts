import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OrchestratorAgent } from './agents/orchestrator';
import { CodeGenAgent } from './agents/codeGen';
import { ExplainAgent } from './agents/explain';
import { createGenerateRouter } from './routes/generate';
import { createExplainRouter } from './routes/explain';
import { createPlaygroundRouter } from './routes/playground';
import notionRouter from './routes/notion';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is required');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize agents
const apiKey = process.env.ANTHROPIC_API_KEY;
const thinkingBudget = parseInt(process.env.EXTENDED_THINKING_BUDGET || '10000');

const orchestrator = new OrchestratorAgent(apiKey);
const codeGen = new CodeGenAgent(apiKey);
const explain = new ExplainAgent(apiKey, thinkingBudget);

// Routes
app.use('/api', createGenerateRouter(orchestrator, codeGen, explain));
app.use('/api', createExplainRouter(explain));
app.use('/api', createPlaygroundRouter());
app.use('/api/notion', notionRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    model: 'claude-sonnet-4-5-20250929',
    extendedThinking: {
      enabled: true,
      budget: thinkingBudget
    }
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Claude Teaches Code backend running on port ${PORT}`);
  console.log(`📚 Extended Thinking enabled with ${thinkingBudget} token budget`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
