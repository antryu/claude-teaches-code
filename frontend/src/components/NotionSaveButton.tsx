import { useState } from 'react';
import { BookmarkPlus, Settings, Check, X, Loader } from 'lucide-react';

interface NotionSaveButtonProps {
  title: string;
  code: string;
  language: string;
  explanation: string;
  keyConcepts?: string[];
  warnings?: string[];
  nextSteps?: string[];
  executionResult?: {
    success: boolean;
    output?: string;
    executionTime?: number;
  };
  performanceData?: {
    average: number;
    min: number;
    max: number;
  };
}

export function NotionSaveButton(props: NotionSaveButtonProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 설정 입력
  const [token, setToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [tags, setTags] = useState('Algorithm, JavaScript');

  const handleConfigure = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Please enter Integration Token' });
      return;
    }

    try {
      const response = await fetch('/api/notion/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, databaseId }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConfigured(true);
        setShowConfig(false);
        setMessage({ type: 'success', text: `Notion connected! (${data.user})` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection failed' });
    }
  };

  const handleSave = async () => {
    if (!isConfigured) {
      setMessage({ type: 'error', text: 'Please configure Notion first' });
      setShowConfig(true);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notion/save-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...props,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Successfully saved to Notion!' });
        setTimeout(() => {
          if (data.pageUrl) {
            window.open(data.pageUrl, '_blank');
          }
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BookmarkPlus className="w-5 h-5 text-purple-500" />
          Save to Notion
        </h4>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Notion Settings"
        >
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 설정 패널 */}
      {showConfig && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Integration Token *
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-purple-500"
            />
            <a
              href="https://www.notion.so/my-integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
            >
              Create Notion Integration →
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database ID (Optional)
            </label>
            <input
              type="text"
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Copy from Database URL: notion.so/workspace/<strong>DATABASE_ID</strong>?v=...
            </p>
          </div>

          <button
            onClick={handleConfigure}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm font-medium"
          >
            <Check className="w-4 h-4" />
            Connect
          </button>
        </div>
      )}

      {/* 태그 입력 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Algorithm, JavaScript, DataStructure"
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded transition-colors text-sm font-medium disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <BookmarkPlus className="w-4 h-4" />
            Save to Notion
          </>
        )}
      </button>

      {/* 상태 메시지 */}
      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 도움말 */}
      {!isConfigured && !showConfig && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          💡 <strong>First time?</strong> Click the gear icon to configure Notion
        </div>
      )}
    </div>
  );
}
