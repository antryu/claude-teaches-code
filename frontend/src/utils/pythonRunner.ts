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
  if (pyodideInstance) {
    console.log('Pyodide already initialized');
    return;
  }

  try {
    console.log('🐍 Pyodide loading... (this may take 10-30 seconds on first load)');
    const startTime = Date.now();

    pyodideInstance = await Promise.race([
      loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/',
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Pyodide loading timeout (60s)')), 60000)
      )
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`✅ Pyodide loaded successfully in ${(loadTime / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error('❌ Pyodide loading failed:', error);
    pyodideInstance = null;
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
      console.log('🔄 Pyodide not loaded, initializing...');
      await initPyodide();
    }

    if (!pyodideInstance) {
      throw new Error('Failed to initialize Pyodide. Please refresh and try again.');
    }

    console.log('▶️ Executing Python code...');

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

    console.log(`✅ Python execution completed in ${executionTime}ms`);

    return {
      success: true,
      output: result || '(Execution completed - No output)',
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    console.error('❌ Python execution error:', error);

    return {
      success: false,
      error: error.message || 'Error during Python execution',
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
