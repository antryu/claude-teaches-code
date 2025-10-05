import { loadPyodide, PyodideInterface } from 'pyodide';

let pyodideInstance: PyodideInterface | null = null;

export interface PythonExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

/**
 * Pyodide 초기화 (최초 1회만)
 */
export async function initPyodide(): Promise<void> {
  if (pyodideInstance) return;

  try {
    console.log('Pyodide 로딩 중...');
    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
    });
    console.log('Pyodide 로딩 완료!');
  } catch (error) {
    console.error('Pyodide 로딩 실패:', error);
    throw error;
  }
}

/**
 * Python 코드 실행
 */
export async function executePython(code: string): Promise<PythonExecutionResult> {
  const startTime = Date.now();

  try {
    // Pyodide가 로드되지 않았으면 로드
    if (!pyodideInstance) {
      await initPyodide();
    }

    if (!pyodideInstance) {
      throw new Error('Pyodide 초기화 실패');
    }

    // stdout 캡처를 위한 래퍼 코드
    const wrappedCode = `
import sys
from io import StringIO

# stdout을 캡처할 StringIO 객체 생성
captured_output = StringIO()
sys.stdout = captured_output

# 사용자 코드 실행
${code}

# 캡처된 출력 가져오기
output = captured_output.getvalue()
output
`;

    // Python 코드 실행
    const result = await pyodideInstance.runPythonAsync(wrappedCode);
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      output: result || '(실행 완료 - 출력 없음)',
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      error: error.message || 'Python 실행 중 오류 발생',
      executionTime,
    };
  }
}

/**
 * Python 성능 측정
 */
export async function measurePythonPerformance(
  code: string,
  iterations: number = 100
): Promise<{
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}> {
  if (!pyodideInstance) {
    await initPyodide();
  }

  if (!pyodideInstance) {
    throw new Error('Pyodide 초기화 실패');
  }

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await pyodideInstance.runPythonAsync(code);
    times.push(performance.now() - startTime);
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const total = times.reduce((a, b) => a + b, 0);

  return {
    iterations,
    averageTime: average,
    minTime: min,
    maxTime: max,
    totalTime: total,
  };
}
