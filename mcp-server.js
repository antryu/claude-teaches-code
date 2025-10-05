#!/usr/bin/env node

/**
 * Claude Desktop MCP 서버 - 독립 실행형
 *
 * 사용법:
 * node mcp-server.js
 *
 * Claude Desktop 설정:
 * ~/Library/Application Support/Claude/claude_desktop_config.json
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class ClaudeCodePlaygroundServer {
  constructor() {
    this.server = new Server(
      {
        name: 'claude-code-playground',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 사용 가능한 도구 목록
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_javascript',
          description: '안전한 샌드박스에서 JavaScript 코드를 실행합니다. console.log 출력을 캡처하여 반환합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: '실행할 JavaScript 코드',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'compare_code_performance',
          description: '여러 JavaScript 코드 구현의 실행 결과와 성능을 비교합니다. 알고리즘 학습에 유용합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              implementations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                description: '비교할 코드 구현 배열',
              },
            },
            required: ['implementations'],
          },
        },
        {
          name: 'explain_js_error',
          description: 'JavaScript 에러를 분석하고 초보자도 이해할 수 있게 설명합니다. 일반적인 원인과 해결 방법을 제공합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: '에러 메시지 또는 스택 트레이스',
              },
              code: {
                type: 'string',
                description: '에러가 발생한 코드 (선택사항)',
              },
            },
            required: ['error'],
          },
        },
      ],
    }));

    // 도구 실행
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'execute_javascript') {
          return await this.executeJavaScript(args.code);
        } else if (name === 'compare_code_performance') {
          return await this.comparePerformance(args.implementations);
        } else if (name === 'explain_js_error') {
          return await this.explainError(args.error, args.code);
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

  async executeJavaScript(code) {
    const startTime = Date.now();

    try {
      const output = [];
      const consoleLog = (...args) => {
        output.push(args.map(String).join(' '));
      };

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
        `'use strict';\n${code}`
      );

      fn(...Object.values(sandbox));

      const executionTime = Date.now() - startTime;

      const result = {
        success: true,
        output: output.length > 0 ? output.join('\n') : '(실행 완료 - 출력 없음)',
        executionTime: `${executionTime}ms`,
      };

      return {
        content: [
          {
            type: 'text',
            text: `✅ 실행 성공\n\n출력:\n${result.output}\n\n실행 시간: ${result.executionTime}`,
          },
        ],
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: `❌ 실행 실패\n\n에러: ${error.message}\n\n실행 시간: ${executionTime}ms`,
          },
        ],
      };
    }
  }

  async comparePerformance(implementations) {
    const results = [];

    for (const impl of implementations) {
      const startTime = Date.now();

      try {
        const output = [];
        const consoleLog = (...args) => {
          output.push(args.map(String).join(' '));
        };

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
          `'use strict';\n${impl.code}`
        );

        fn(...Object.values(sandbox));

        const executionTime = Date.now() - startTime;

        results.push({
          label: impl.label,
          success: true,
          output: output.join('\n') || '(출력 없음)',
          executionTime,
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;

        results.push({
          label: impl.label,
          success: false,
          error: error.message,
          executionTime,
        });
      }
    }

    // 가장 빠른 구현 찾기
    const successfulResults = results.filter((r) => r.success);
    const fastest = successfulResults.reduce((prev, curr) =>
      prev.executionTime < curr.executionTime ? prev : curr
    );

    let report = '📊 성능 비교 결과\n\n';
    results.forEach((r) => {
      report += `${r.label}:\n`;
      if (r.success) {
        report += `  ✅ 성공 - ${r.executionTime}ms\n`;
        report += `  출력: ${r.output}\n`;
      } else {
        report += `  ❌ 실패 - ${r.error}\n`;
      }
      report += '\n';
    });

    if (fastest) {
      report += `🏆 가장 빠른 구현: ${fastest.label} (${fastest.executionTime}ms)\n`;
    }

    return {
      content: [{ type: 'text', text: report }],
    };
  }

  async explainError(errorMessage, code) {
    // 에러 타입 파싱
    const errorType = this.parseErrorType(errorMessage);
    const explanation = this.getErrorExplanation(errorType);
    const causes = this.getCommonCauses(errorType);
    const solutions = this.getSolutions(errorType);

    let report = `🔍 에러 분석\n\n`;
    report += `에러 타입: ${errorType}\n\n`;
    report += `설명:\n${explanation}\n\n`;
    report += `일반적인 원인:\n`;
    causes.forEach((cause, i) => {
      report += `${i + 1}. ${cause}\n`;
    });
    report += `\n해결 방법:\n`;
    solutions.forEach((solution, i) => {
      report += `${i + 1}. ${solution}\n`;
    });

    if (code) {
      report += `\n코드:\n\`\`\`javascript\n${code}\n\`\`\`\n`;
    }

    return {
      content: [{ type: 'text', text: report }],
    };
  }

  parseErrorType(error) {
    if (/TypeError/.test(error)) return 'TypeError';
    if (/ReferenceError/.test(error)) return 'ReferenceError';
    if (/SyntaxError/.test(error)) return 'SyntaxError';
    if (/RangeError/.test(error)) return 'RangeError';
    if (error.includes('is not defined')) return 'ReferenceError';
    if (error.includes('is not a function')) return 'TypeError';
    return 'Error';
  }

  getErrorExplanation(errorType) {
    const explanations = {
      TypeError:
        '타입 에러: 변수나 값의 타입이 예상과 다를 때 발생합니다.',
      ReferenceError:
        '참조 에러: 존재하지 않는 변수를 참조하려고 할 때 발생합니다.',
      SyntaxError: '문법 에러: JavaScript 문법 규칙을 위반했을 때 발생합니다.',
      RangeError: '범위 에러: 값이 허용된 범위를 벗어났을 때 발생합니다.',
    };
    return explanations[errorType] || '알 수 없는 에러입니다.';
  }

  getCommonCauses(errorType) {
    const causes = {
      TypeError: [
        'null 또는 undefined 값에 속성 접근',
        '함수가 아닌 것을 함수로 호출',
        '잘못된 타입의 인자 전달',
      ],
      ReferenceError: [
        '변수를 선언하지 않고 사용',
        '스코프 밖의 변수 접근',
        '변수명 오타',
      ],
      SyntaxError: [
        '괄호 짝이 맞지 않음',
        '세미콜론 누락',
        '예약어를 변수명으로 사용',
      ],
      RangeError: ['무한 재귀 호출', '배열 길이가 음수', '너무 큰 숫자'],
    };
    return causes[errorType] || ['원인을 파악할 수 없습니다.'];
  }

  getSolutions(errorType) {
    const solutions = {
      TypeError: [
        'null/undefined 체크: if (variable) { ... }',
        'optional chaining 사용: variable?.property',
        'typeof로 타입 확인',
      ],
      ReferenceError: [
        'const, let, var로 변수 선언',
        '스코프 확인',
        '변수명 오타 확인',
      ],
      SyntaxError: ['ESLint 사용', '괄호 짝 맞추기', 'Prettier로 포맷'],
      RangeError: ['재귀 함수에 탈출 조건 추가', '배열 길이 유효성 검사'],
    };
    return solutions[errorType] || ['해결 방법을 찾을 수 없습니다.'];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Claude Code Playground MCP Server running');
  }
}

// 서버 실행
const server = new ClaudeCodePlaygroundServer();
server.run().catch(console.error);
