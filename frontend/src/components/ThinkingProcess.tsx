import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';

interface ThinkingProcessProps {
  thinking?: string;
  extendedThinking?: string;
  isStreaming?: boolean;
}

export function ThinkingProcess({ thinking, extendedThinking, isStreaming }: ThinkingProcessProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking && !extendedThinking && !isStreaming) return null;

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-purple-900 dark:text-purple-100">
            {t('thinking.title')}
          </span>
          {isStreaming && (
            <motion.span
              className="text-sm text-purple-600 dark:text-purple-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {t('thinking.analyzing')}
            </motion.span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-purple-200 dark:border-purple-800"
          >
            <div className="p-4 space-y-4">
              {thinking && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Thinking Process
                  </h4>
                  <div className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded">
                    {thinking}
                  </div>
                </div>
              )}

              {extendedThinking && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Extended Thinking (Deep Analysis)
                  </h4>
                  <div className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded max-h-96 overflow-y-auto">
                    {extendedThinking}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
