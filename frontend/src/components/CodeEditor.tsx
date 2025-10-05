import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { Copy, Download, HelpCircle } from 'lucide-react';
import { GeneratedCode, LineExplanation } from '../types';

interface CodeEditorProps {
  code: GeneratedCode | null;
  theme: 'light' | 'dark';
  onExplainLine: (lineNumber: number) => void;
  lineExplanations: LineExplanation[];
}

export function CodeEditor({ code, theme, onExplainLine, lineExplanations }: CodeEditorProps) {
  const { t } = useTranslation();
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const handleCopy = () => {
    if (code?.code) {
      navigator.clipboard.writeText(code.code);
    }
  };

  const handleDownload = () => {
    if (code?.code) {
      const blob = new Blob([code.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code.${code.language || 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>{t('editor.placeholder')}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '450px', display: 'flex', flexDirection: 'column' }} className="bg-white dark:bg-gray-900">
      {/* Header - Fixed Height */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" style={{ height: '50px', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {code.language.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('editor.copy')}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('editor.download')}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor - Remaining Height */}
      <div style={{ width: '100%', height: 'calc(450px - 50px)', position: 'relative' }} className="bg-[#1e1e1e]">
        <Editor
          width="100%"
          height="100%"
          language={code.language}
          value={code.code}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            fontSize: 14,
            lineHeight: 20,
            fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
            fontLigatures: true,
            padding: { top: 10, bottom: 10 },
            wordWrap: 'on',
            wrappingIndent: 'indent',
            automaticLayout: true,
          }}
          onMount={(editor, monaco) => {
            const model = editor.getModel();
            if (!model) return;

            // Handle any click on line numbers or content to explain that line
            editor.onMouseDown((e) => {
              const position = e.target.position;
              if (position?.lineNumber) {
                const lineNumber = position.lineNumber;
                console.log('Line clicked:', lineNumber);
                onExplainLine(lineNumber);
              }
            });

            // Add visual indicator on hover
            editor.onMouseMove((e) => {
              const position = e.target.position;
              if (position?.lineNumber) {
                editor.updateOptions({
                  renderLineHighlight: 'all'
                });
              }
            });
          }}
        />
      </div>
    </div>
  );
}
