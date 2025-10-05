import { useState } from 'react';
import { Activity, Play, BarChart3, TrendingUp } from 'lucide-react';

interface PerformanceResult {
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}

interface PerformanceMeasureProps {
  code: string;
  language: string;
  onPerformanceResult?: (result: { average: number; min: number; max: number }) => void;
}

export function PerformanceMeasure({ code, language, onPerformanceResult }: PerformanceMeasureProps) {
  const [result, setResult] = useState<PerformanceResult | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [iterations, setIterations] = useState<number>(1000);

  const handleMeasure = async () => {
    setIsMeasuring(true);
    setResult(null);

    try {
      const response = await fetch('/api/playground/measure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, iterations }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (onPerformanceResult) {
          onPerformanceResult({
            average: data.data.averageTime,
            min: data.data.minTime,
            max: data.data.maxTime,
          });
        }
      } else {
        alert('측정 실패: ' + data.error);
      }
    } catch (error) {
      alert('측정 중 오류 발생: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsMeasuring(false);
    }
  };

  const canMeasure =
    (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') &&
    code.trim().length > 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          성능 측정
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">반복 횟수:</label>
            <select
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value={100}>100</option>
              <option value={1000}>1,000</option>
              <option value={10000}>10,000</option>
            </select>
          </div>
          <button
            onClick={handleMeasure}
            disabled={isMeasuring || !canMeasure}
            className="flex items-center gap-2 px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm hover:scale-105 active:scale-95"
          >
            <Play className={`w-4 h-4 ${isMeasuring ? 'animate-spin' : ''}`} />
            {isMeasuring ? '측정 중...' : '측정 시작'}
          </button>
        </div>
      </div>

      {!canMeasure && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
          💡 JavaScript 코드만 성능 측정이 가능합니다.
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* 메트릭 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">평균 시간</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {result.averageTime.toFixed(2)}ms
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">최소 시간</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {result.minTime.toFixed(2)}ms
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">최대 시간</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {result.maxTime.toFixed(2)}ms
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">총 시간</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {result.totalTime.toFixed(2)}ms
              </div>
            </div>
          </div>

          {/* 비주얼 바 차트 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              시간 분포
            </h4>
            <div className="space-y-2">
              {/* 평균 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">평균</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {result.averageTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${(result.averageTime / result.maxTime) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* 최소 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">최소</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {result.minTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${(result.minTime / result.maxTime) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* 최대 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">최대</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">
                    {result.maxTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 분석 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              분석
            </h4>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              <li>
                • {result.iterations.toLocaleString()}번 실행 완료
              </li>
              <li>
                • 최소/최대 차이:{' '}
                {((result.maxTime - result.minTime) / result.minTime * 100).toFixed(1)}%
              </li>
              <li>
                • 1회당 평균:{' '}
                {(result.averageTime).toFixed(4)}ms
              </li>
              {result.averageTime < 1 && (
                <li className="text-green-600 dark:text-green-400">
                  ✓ 매우 빠른 실행 속도
                </li>
              )}
              {result.averageTime >= 1 && result.averageTime < 10 && (
                <li className="text-blue-600 dark:text-blue-400">✓ 양호한 실행 속도</li>
              )}
              {result.averageTime >= 10 && (
                <li className="text-orange-600 dark:text-orange-400">
                  ⚠ 최적화 검토 권장
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
