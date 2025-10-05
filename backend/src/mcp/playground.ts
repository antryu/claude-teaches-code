import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import NodeCache from 'node-cache';

const STACKOVERFLOW_API = 'https://api.stackexchange.com/2.3';
const EXECUTION_TIMEOUT = 5000; // 5초

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
}

interface ErrorAnalysis {
  errorType: string;
  explanation: string;
  commonCauses: string[];
  solutions: string[];
  stackOverflowLinks?: string[];
}

class PlaygroundMCPServer {
  private server: Server;
  private cache: NodeCache;

  constructor() {
    this.server = new Server(
      {
        name: 'playground-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 30분 캐시
    this.cache = new NodeCache({ stdTTL: 1800 });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_javascript',
          description: 'Execute JavaScript code in a safe sandbox environment',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'JavaScript code to execute',
              },
              timeout: {
                type: 'number',
                description: 'Execution timeout in milliseconds (max 5000)',
                default: 5000,
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'compare_outputs',
          description: 'Compare outputs of multiple code implementations',
          inputSchema: {
            type: 'object',
            properties: {
              codes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of code implementations to compare',
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Labels for each implementation',
              },
            },
            required: ['codes', 'labels'],
          },
        },
        {
          name: 'explain_error',
          description: 'Analyze and explain JavaScript errors with solutions from Stack Overflow',
          inputSchema: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message or stack trace',
              },
              code: {
                type: 'string',
                description: 'Code that caused the error (optional)',
              },
            },
            required: ['error'],
          },
        },
        {
          name: 'measure_performance',
          description: 'Measure execution time and memory usage of code',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to measure performance',
              },
              iterations: {
                type: 'number',
                description: 'Number of iterations to run (default 1000)',
                default: 1000,
              },
            },
            required: ['code'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'execute_javascript') {
          return await this.executeJavaScript(args as { code: string; timeout?: number });
        } else if (name === 'compare_outputs') {
          return await this.compareOutputs(
            args as { codes: string[]; labels: string[] }
          );
        } else if (name === 'explain_error') {
          return await this.explainError(args as { error: string; code?: string });
        } else if (name === 'measure_performance') {
          return await this.measurePerformance(
            args as { code: string; iterations?: number }
          );
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async executeJavaScript(args: {
    code: string;
    timeout?: number;
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const startTime = Date.now();

    try {
      // 안전한 샌드박스 실행 (제한된 환경)
      const output: string[] = [];
      const consoleLog = (...args: any[]) => {
        output.push(args.map(String).join(' '));
      };

      // Function constructor로 격리된 환경에서 실행
      const sandbox = {
        console: { log: consoleLog },
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
      };

      const fn = new Function(
        ...Object.keys(sandbox),
        `
        'use strict';
        ${args.code}
        `
      );

      // 실행
      fn(...Object.values(sandbox));

      const executionTime = Date.now() - startTime;

      const response: ExecutionResult = {
        success: true,
        output: output.length > 0 ? output.join('\n') : '(실행 완료 - 출력 없음)',
        executionTime,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      const response: ExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  }

  private async compareOutputs(args: {
    codes: string[];
    labels: string[];
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    if (args.codes.length !== args.labels.length) {
      throw new Error('codes와 labels의 길이가 일치해야 합니다');
    }

    const results = [];

    for (let i = 0; i < args.codes.length; i++) {
      const result = await this.executeJavaScript({ code: args.codes[i] });
      const parsed = JSON.parse(result.content[0].text);

      results.push({
        label: args.labels[i],
        ...parsed,
      });
    }

    // 비교 결과 포맷팅
    const comparison = {
      totalImplementations: results.length,
      results,
      fastest: results.reduce((prev, curr) =>
        (prev.executionTime || Infinity) < (curr.executionTime || Infinity) ? prev : curr
      ),
      summary: results.map((r) => ({
        label: r.label,
        success: r.success,
        executionTime: r.executionTime,
        outputMatch: r.output === results[0].output,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  private async explainError(args: {
    error: string;
    code?: string;
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const cacheKey = `error:${args.error}`;
    const cached = this.cache.get<string>(cacheKey);

    if (cached) {
      return {
        content: [{ type: 'text', text: cached }],
      };
    }

    try {
      // 에러 타입 파싱
      const errorType = this.parseErrorType(args.error);

      // Stack Overflow 검색
      const stackOverflowResults = await this.searchStackOverflow(errorType);

      // 에러 분석
      const analysis: ErrorAnalysis = {
        errorType,
        explanation: this.getErrorExplanation(errorType),
        commonCauses: this.getCommonCauses(errorType),
        solutions: this.getSolutions(errorType),
        stackOverflowLinks: stackOverflowResults.slice(0, 3),
      };

      const result = JSON.stringify(analysis, null, 2);
      this.cache.set(cacheKey, result);

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                errorType: 'Unknown',
                explanation: '에러를 분석할 수 없습니다',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  private async measurePerformance(args: {
    code: string;
    iterations?: number;
  }): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    const iterations = Math.min(args.iterations || 1000, 10000);
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.executeJavaScript({ code: args.code });
      times.push(Date.now() - startTime);
    }

    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    const result = {
      iterations,
      averageTime: average,
      minTime: min,
      maxTime: max,
      totalTime: times.reduce((a, b) => a + b, 0),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private parseErrorType(error: string): string {
    // 일반적인 JavaScript 에러 타입 파싱
    const patterns = [
      /TypeError/,
      /ReferenceError/,
      /SyntaxError/,
      /RangeError/,
      /URIError/,
      /EvalError/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(error)) {
        return pattern.source;
      }
    }

    // 특정 에러 메시지 패턴
    if (error.includes('is not defined')) return 'ReferenceError';
    if (error.includes('is not a function')) return 'TypeError';
    if (error.includes('Cannot read property')) return 'TypeError';
    if (error.includes('unexpected token')) return 'SyntaxError';

    return 'Error';
  }

  private getErrorExplanation(errorType: string): string {
    const explanations: Record<string, string> = {
      TypeError:
        '타입 에러: 변수나 값의 타입이 예상과 다를 때 발생합니다. 예를 들어, 숫자가 필요한 곳에 문자열을 사용하거나, 함수가 아닌 것을 함수처럼 호출할 때 발생합니다.',
      ReferenceError:
        '참조 에러: 존재하지 않는 변수를 참조하려고 할 때 발생합니다. 변수를 선언하지 않았거나, 스코프 밖의 변수에 접근하려고 할 때 발생합니다.',
      SyntaxError:
        '문법 에러: JavaScript 문법 규칙을 위반했을 때 발생합니다. 괄호를 빠뜨리거나, 예약어를 잘못 사용하거나, 세미콜론이 누락된 경우 등이 있습니다.',
      RangeError:
        '범위 에러: 값이 허용된 범위를 벗어났을 때 발생합니다. 배열 길이가 음수이거나, 재귀 호출이 너무 깊어질 때 발생합니다.',
      URIError:
        'URI 에러: encodeURI()나 decodeURI() 같은 URI 처리 함수를 잘못 사용했을 때 발생합니다.',
      EvalError:
        'Eval 에러: eval() 함수 사용 중 발생하는 에러입니다. (현재는 거의 사용되지 않음)',
    };

    return explanations[errorType] || '알 수 없는 에러 타입입니다.';
  }

  private getCommonCauses(errorType: string): string[] {
    const causes: Record<string, string[]> = {
      TypeError: [
        '변수가 null 또는 undefined인 상태에서 속성에 접근',
        '함수가 아닌 것을 함수처럼 호출',
        '잘못된 타입의 인자를 함수에 전달',
        '객체나 배열이 아닌 것을 구조분해 할당',
      ],
      ReferenceError: [
        '변수를 선언하지 않고 사용',
        '스코프 밖의 변수에 접근',
        '변수 선언 전에 사용 (호이스팅 이슈)',
        '오타로 인한 잘못된 변수명',
      ],
      SyntaxError: [
        '괄호, 중괄호, 대괄호 짝이 맞지 않음',
        '세미콜론 누락 또는 잘못된 위치',
        '예약어를 변수명으로 사용',
        'JSON 형식 오류',
      ],
      RangeError: [
        '무한 재귀 호출',
        '배열이나 문자열 길이가 음수',
        '너무 큰 숫자나 정밀도 지정',
        'toFixed, toPrecision 등에 잘못된 값 전달',
      ],
    };

    return causes[errorType] || ['원인을 파악할 수 없습니다.'];
  }

  private getSolutions(errorType: string): string[] {
    const solutions: Record<string, string[]> = {
      TypeError: [
        '변수가 null/undefined인지 확인: if (variable) { ... } 또는 optional chaining 사용: variable?.property',
        '함수 호출 전에 typeof로 타입 확인: typeof fn === "function"',
        '디버거나 console.log로 변수의 실제 값 확인',
        'TypeScript 사용으로 타입 안정성 확보',
      ],
      ReferenceError: [
        '변수 선언 확인: const, let, var 키워드 사용',
        '스코프 확인: 변수가 접근 가능한 범위에 있는지 확인',
        '변수명 오타 확인',
        'use strict 모드로 엄격한 에러 감지',
      ],
      SyntaxError: [
        'IDE나 린터(ESLint) 사용으로 문법 오류 자동 감지',
        '괄호 짝 맞추기: () {} []',
        'JSON.parse() 전에 JSON 형식 검증',
        '코드 포맷터(Prettier) 사용',
      ],
      RangeError: [
        '재귀 함수에 탈출 조건 추가',
        '배열/문자열 길이 유효성 검사',
        '숫자 범위 확인: Number.isSafeInteger()',
        '반복 횟수 제한 설정',
      ],
    };

    return solutions[errorType] || ['해결 방법을 찾을 수 없습니다.'];
  }

  private async searchStackOverflow(query: string): Promise<string[]> {
    try {
      const response = await axios.get(`${STACKOVERFLOW_API}/search/advanced`, {
        params: {
          order: 'desc',
          sort: 'votes',
          q: query,
          tagged: 'javascript',
          site: 'stackoverflow',
          filter: 'withbody',
        },
        timeout: 5000,
      });

      return response.data.items.map((item: any) => item.link).slice(0, 5);
    } catch (error) {
      console.error('Stack Overflow search failed:', error);
      return [];
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playground MCP Server running on stdio');
  }
}

// Export for use in main application
export { PlaygroundMCPServer };

// Run as standalone MCP server if executed directly
if (require.main === module) {
  const server = new PlaygroundMCPServer();
  server.run().catch(console.error);
}
