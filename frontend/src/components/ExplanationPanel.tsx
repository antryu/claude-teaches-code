import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ExplanationResponse } from '../types';
import { Lightbulb, AlertTriangle } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: ExplanationResponse | null;
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  const { t } = useTranslation();

  if (!explanation) {
    return (
      <div style={{ width: '100%', height: '700px' }} className="flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900">
        <p>Select a line or request an explanation to see details here</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '700px', overflow: 'auto' }} className="p-6 space-y-6 bg-white dark:bg-gray-900">
      {/* Main Explanation */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t('explanation.title')}
        </h3>
        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
          <div className="leading-relaxed space-y-3 text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {explanation.explanation}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      {explanation.keyConcepts && explanation.keyConcepts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {t('explanation.keyConcepts')}
            </h4>
          </div>
          <ul className="space-y-2">
            {explanation.keyConcepts.map((concept, i) => (
              <li key={i} className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed pl-2">
                • {concept}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes */}
      {explanation.commonMistakes && explanation.commonMistakes.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-5 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
              {t('explanation.commonMistakes')}
            </h4>
          </div>
          <ul className="space-y-2">
            {explanation.commonMistakes.map((mistake, i) => (
              <li key={i} className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed pl-2">
                • {mistake}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extended Thinking */}
      {explanation.extendedThinking && (
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
          <h4 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            Deep Analysis (Extended Thinking)
          </h4>
          <div className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap max-h-[300px] overflow-y-auto leading-relaxed">
            {explanation.extendedThinking}
          </div>
        </div>
      )}
    </div>
  );
}
