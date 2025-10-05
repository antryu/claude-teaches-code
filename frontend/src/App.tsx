import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { ThinkingProcess } from './components/ThinkingProcess';
import { ExplanationPanel } from './components/ExplanationPanel';
import { CodePlayground } from './components/CodePlayground';
import { NotionSaveButton } from './components/NotionSaveButton';
import {
  GeneratedCode,
  OrchestratorResponse,
  ExplanationResponse,
  LineExplanation,
  Language,
} from './types';
import { generateCodeStream, explainLine } from './services/api';
import './i18n/config';

function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflow, setWorkflow] = useState<OrchestratorResponse | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [thinking, setThinking] = useState('');
  const [extendedThinking, setExtendedThinking] = useState('');
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [lineExplanations, setLineExplanations] = useState<LineExplanation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    output?: string;
    executionTime?: number;
  } | null>(null);
  const [performanceData, setPerformanceData] = useState<{
    average: number;
    min: number;
    max: number;
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setWorkflow(null);
    setGeneratedCode(null);
    setThinking('');
    setExtendedThinking('');
    setExplanation(null);
    setLineExplanations([]);

    try {
      for await (const message of generateCodeStream(prompt, language)) {
        switch (message.type) {
          case 'workflow':
            if (message.data.intent) {
              setWorkflow(message.data as OrchestratorResponse);
            } else {
              setCurrentStep(message.data.step || message.data.agent);
            }
            break;

          case 'thinking':
            if (message.data.chunk) {
              setThinking((prev) => prev + message.data.chunk);
            }
            break;

          case 'code':
            if (message.data.code) {
              setGeneratedCode({
                code: message.data.code,
                language: message.data.language || 'text',
                thinking: message.data.thinking || '',
                keyDecisions: message.data.keyDecisions || [],
                nextSteps: message.data.nextSteps || [],
              });
            }
            break;

          case 'explanation':
            if (message.data.explanation) {
              setExplanation(message.data as ExplanationResponse);
              if (message.data.extendedThinking) {
                setExtendedThinking(message.data.extendedThinking);
              }
            }
            break;

          case 'complete':
            setCurrentStep('complete');
            break;

          case 'error':
            setError(message.data.message);
            break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplainLine = async (lineNumber: number) => {
    if (!generatedCode) return;

    try {
      const lineExp = await explainLine(
        generatedCode.code,
        lineNumber,
        language,
        generatedCode.language
      );

      setLineExplanations((prev) => [
        ...prev.filter((e) => e.lineNumber !== lineNumber),
        { lineNumber, explanation: lineExp },
      ]);

      setExplanation(lineExp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explain line');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ko' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('app.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('language.korean')}
              >
                <Globe className="w-5 h-5" />
                <span className="ml-2 text-sm">
                  {language === 'en' ? '한국어' : 'English'}
                </span>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Input Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6 transition-all duration-300 hover:shadow-md">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('editor.placeholder')}
            className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 focus:scale-[1.01]"
            disabled={isGenerating}
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isGenerating ? t('loading.processing') : t('editor.generate')}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Workflow Visualizer */}
        {workflow && (
          <div className="mb-6">
            <WorkflowVisualizer workflow={workflow} currentStep={currentStep} />
          </div>
        )}

        {/* Thinking Process */}
        <div className="mb-6">
          <ThinkingProcess
            thinking={thinking}
            extendedThinking={extendedThinking}
            isStreaming={isGenerating}
          />
        </div>

        {/* Code and Explanation Layout */}
        {generatedCode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column: Code + Metadata */}
            <div className="flex flex-col" style={{ height: '700px', gap: '24px' }}>
              {/* Code Box */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '450px', flexShrink: 0 }}>
                <CodeEditor
                  code={generatedCode}
                  theme={theme}
                  onExplainLine={handleExplainLine}
                  lineExplanations={lineExplanations}
                />
              </div>

              {/* Key Decisions & Next Steps */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-auto" style={{ height: '226px', flexShrink: 0 }}>
                {generatedCode.keyDecisions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('codeEditor.keyDecisions')}
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      {generatedCode.keyDecisions.map((decision, i) => (
                        <li key={i}>• {decision}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {generatedCode.nextSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('codeEditor.nextSteps')}
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      {generatedCode.nextSteps.map((step, i) => (
                        <li key={i}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Full Explanation Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '700px', flexShrink: 0 }}>
              <ExplanationPanel explanation={explanation} />
            </div>
          </div>
        )}

        {/* Bottom Section: Interactive Tools */}
        {generatedCode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Playground */}
            <CodePlayground
              code={generatedCode.code}
              language={generatedCode.language}
              onExecutionResult={setExecutionResult}
            />

            {/* Notion Save Button */}
            <NotionSaveButton
              title={prompt.substring(0, 100)}
              code={generatedCode.code}
              language={generatedCode.language}
              explanation={explanation?.explanation || ''}
              keyConcepts={explanation?.keyConcepts}
              warnings={explanation?.warnings}
              nextSteps={explanation?.nextSteps}
              executionResult={executionResult || undefined}
              performanceData={performanceData || undefined}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
