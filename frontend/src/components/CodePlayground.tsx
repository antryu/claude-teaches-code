import { useState } from 'react';
import { Play, Zap, AlertCircle, CheckCircle, Clock, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { executePython } from '../utils/pythonRunner';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

interface CodePlaygroundProps {
  code: string;
  language: string;
  onExecutionResult?: (result: { success: boolean; output?: string; executionTime?: number }) => void;
}

export function CodePlayground({ code, language, onExecutionResult }: CodePlaygroundProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);

  const handleRun = async () => {
    const normalizedLang = language.toLowerCase();
    console.log('🎮 CodePlayground handleRun called, language:', normalizedLang);

    // JavaScript 실행
    if (normalizedLang === 'javascript' || normalizedLang === 'js') {
      console.log('📝 Executing JavaScript code');
      setIsRunning(true);
      setResult(null);

      try {
        console.log('🌐 Fetching /api/playground/execute...');
        const response = await fetch('/api/playground/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success) {
          setResult(data.data);
          if (onExecutionResult) {
            onExecutionResult({
              success: true,
              output: data.data.output,
              executionTime: data.data.executionTime,
            });
          }
        } else {
          setResult({
            success: false,
            error: data.error || '실행 실패',
          });
          if (onExecutionResult) {
            onExecutionResult({ success: false });
          }
        }
      } catch (error) {
        const errorResult = {
          success: false,
          error: error instanceof Error ? error.message : '실행 중 오류 발생',
        };
        setResult(errorResult);
        if (onExecutionResult) {
          onExecutionResult({ success: false });
        }
      } finally {
        setIsRunning(false);
      }
      return;
    }

    // Python 실행
    if (normalizedLang === 'python' || normalizedLang === 'py') {
      setIsRunning(true);
      setIsPyodideLoading(true);
      setResult(null);

      try {
        const pythonResult = await executePython(code);
        setResult(pythonResult);
        if (onExecutionResult && pythonResult.success) {
          onExecutionResult({
            success: true,
            output: pythonResult.output,
            executionTime: pythonResult.executionTime,
          });
        } else if (onExecutionResult) {
          onExecutionResult({ success: false });
        }
      } catch (error) {
        const errorResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Python 실행 중 오류 발생',
        };
        setResult(errorResult);
        if (onExecutionResult) {
          onExecutionResult({ success: false });
        }
      } finally {
        setIsRunning(false);
        setIsPyodideLoading(false);
      }
      return;
    }

    // 지원하지 않는 언어
    setResult({
      success: false,
      error: `${language} 실행은 아직 지원하지 않습니다. JavaScript 또는 Python만 실행 가능합니다.`,
    });
  };

  const canRun =
    language.toLowerCase() === 'javascript' ||
    language.toLowerCase() === 'js' ||
    language.toLowerCase() === 'python' ||
    language.toLowerCase() === 'py';

  console.log('CodePlayground render - language:', language, 'canRun:', canRun);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          {t('codePlayground.title')}
        </h4>
        <button
          onClick={handleRun}
          disabled={isRunning || !canRun}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 text-sm font-medium disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        >
          <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? t('codePlayground.running') : t('codePlayground.run')}
        </button>
      </div>

      {!canRun && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
          {t('codePlayground.notSupported')}
        </div>
      )}

      {isPyodideLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
          {t('codePlayground.pyodideLoading')}
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-4 border animate-fade-in ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h5
                className={`font-semibold mb-1 ${
                  result.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {result.success ? t('codePlayground.success') : t('codePlayground.failed')}
              </h5>
              {result.executionTime !== undefined && (
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <Clock className="w-3 h-3" />
                  <span>{result.executionTime}ms</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`font-mono text-sm whitespace-pre-wrap rounded p-3 ${
              result.success
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                : 'bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100'
            }`}
          >
            {result.success ? result.output : result.error}
          </div>
        </div>
      )}
    </div>
  );
}
