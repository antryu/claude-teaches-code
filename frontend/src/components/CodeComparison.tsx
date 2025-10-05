import { useState } from 'react';
import { GitCompare, Play, Trophy, Clock, XCircle } from 'lucide-react';

interface ComparisonResult {
  label: string;
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  outputMatch?: boolean;
}

interface CodeComparisonProps {
  onCompare?: (results: ComparisonResult[]) => void;
}

export function CodeComparison({ onCompare }: CodeComparisonProps) {
  const [codes, setCodes] = useState<string[]>(['', '']);
  const [labels, setLabels] = useState<string[]>(['방법 1', '방법 2']);
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleAddCode = () => {
    if (codes.length < 5) {
      setCodes([...codes, '']);
      setLabels([...labels, `방법 ${codes.length + 1}`]);
    }
  };

  const handleRemoveCode = (index: number) => {
    if (codes.length > 2) {
      setCodes(codes.filter((_, i) => i !== index));
      setLabels(labels.filter((_, i) => i !== index));
    }
  };

  const handleCompare = async () => {
    setIsComparing(true);
    setResults(null);

    try {
      const response = await fetch('/api/playground/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes, labels }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        if (onCompare) {
          onCompare(data.data.results);
        }
      } else {
        alert('비교 실패: ' + data.error);
      }
    } catch (error) {
      alert('비교 중 오류 발생: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsComparing(false);
    }
  };

  const canCompare = codes.every((code) => code.trim().length > 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-purple-600" />
          코드 비교 (Code Comparison)
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAddCode}
            disabled={codes.length >= 5}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            + 코드 추가
          </button>
          <button
            onClick={handleCompare}
            disabled={isComparing || !canCompare}
            className="flex items-center gap-2 px-4 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Play className={`w-4 h-4 ${isComparing ? 'animate-pulse' : ''}`} />
            {isComparing ? '비교 중...' : '비교 실행'}
          </button>
        </div>
      </div>

      {/* 코드 입력 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codes.map((code, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={labels[index]}
                onChange={(e) => {
                  const newLabels = [...labels];
                  newLabels[index] = e.target.value;
                  setLabels(newLabels);
                }}
                className="text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 outline-none px-1 text-gray-900 dark:text-gray-100"
              />
              {codes.length > 2 && (
                <button
                  onClick={() => handleRemoveCode(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <textarea
              value={code}
              onChange={(e) => {
                const newCodes = [...codes];
                newCodes[index] = e.target.value;
                setCodes(newCodes);
              }}
              placeholder="JavaScript 코드 입력..."
              className="w-full h-32 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
            />
          </div>
        ))}
      </div>

      {/* 비교 결과 */}
      {results && (
        <div className="space-y-3 pt-4 border-t border-gray-300 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            비교 결과
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border ${
                  result.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                    {result.label}
                  </h5>
                  {result.executionTime !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{result.executionTime.toFixed(2)}ms</span>
                    </div>
                  )}
                </div>

                <div className="text-sm font-mono bg-white dark:bg-gray-900 rounded p-2 text-gray-900 dark:text-gray-100">
                  {result.success ? result.output : result.error}
                </div>

                {result.outputMatch !== undefined && (
                  <div className="mt-2 text-xs">
                    {result.outputMatch ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ 출력 일치
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">✗ 출력 불일치</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 가장 빠른 코드 표시 */}
          {results.every((r) => r.success && r.executionTime !== undefined) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">
                  가장 빠름:{' '}
                  {
                    results.reduce((prev, curr) =>
                      (prev.executionTime || Infinity) < (curr.executionTime || Infinity)
                        ? prev
                        : curr
                    ).label
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
