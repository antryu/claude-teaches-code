import { PlaygroundMCPServer } from '../mcp/playground';
import { DocumentationMCPServer } from '../mcp/documentation';

/**
 * MCP 통합 서비스
 * AI 에이전트가 MCP 도구를 사용할 수 있도록 연결
 */
export class MCPIntegration {
  private playgroundServer: PlaygroundMCPServer;
  private docsServer: DocumentationMCPServer;

  constructor() {
    this.playgroundServer = new PlaygroundMCPServer();
    this.docsServer = new DocumentationMCPServer();
  }

  /**
   * Claude Tool Use 형식으로 MCP 도구 정의 반환
   */
  getToolsForClaude() {
    return [
      // Playground Tools
      {
        name: 'execute_javascript',
        description: 'JavaScript 코드를 안전한 샌드박스에서 실행합니다. 학습자가 작성한 코드의 결과를 즉시 확인할 수 있습니다.',
        input_schema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: '실행할 JavaScript 코드',
            },
            timeout: {
              type: 'number',
              description: '실행 제한 시간 (밀리초, 최대 5000)',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'compare_outputs',
        description: '여러 코드 구현의 실행 결과와 성능을 비교합니다. 서로 다른 알고리즘이나 접근 방식을 비교 학습할 때 유용합니다.',
        input_schema: {
          type: 'object',
          properties: {
            codes: {
              type: 'array',
              items: { type: 'string' },
              description: '비교할 코드 배열',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: '각 코드의 라벨',
            },
          },
          required: ['codes', 'labels'],
        },
      },
      {
        name: 'explain_error',
        description: 'JavaScript 에러를 분석하고 초보자도 이해할 수 있게 설명합니다. Stack Overflow에서 관련 해결 방법도 찾아줍니다.',
        input_schema: {
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
      {
        name: 'measure_performance',
        description: '코드의 실행 시간과 성능을 측정합니다. 알고리즘 복잡도를 실제로 체험할 수 있습니다.',
        input_schema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: '성능을 측정할 코드',
            },
            iterations: {
              type: 'number',
              description: '반복 횟수 (기본값 1000)',
            },
          },
          required: ['code'],
        },
      },
      // Documentation Tools
      {
        name: 'fetch_docs',
        description: 'DevDocs에서 프레임워크/라이브러리의 공식 문서를 가져옵니다. 최신 API 레퍼런스를 확인할 수 있습니다.',
        input_schema: {
          type: 'object',
          properties: {
            library: {
              type: 'string',
              description: '라이브러리 이름 (예: "react", "javascript", "python")',
            },
            query: {
              type: 'string',
              description: '검색할 특정 주제',
            },
          },
          required: ['library'],
        },
      },
      {
        name: 'search_examples',
        description: 'GitHub에서 실제 코드 예제를 검색합니다. 프로덕션 코드에서 사용되는 패턴을 학습할 수 있습니다.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '검색 쿼리',
            },
            language: {
              type: 'string',
              description: '프로그래밍 언어 필터',
            },
            limit: {
              type: 'number',
              description: '결과 개수 (기본값 5)',
            },
          },
          required: ['query'],
        },
      },
    ];
  }

  /**
   * 도구 호출 실행
   */
  async executeTool(toolName: string, toolInput: any): Promise<any> {
    // Playground 서버의 CallToolRequest 형식으로 변환
    const request = {
      params: {
        name: toolName,
        arguments: toolInput,
      },
    };

    // 도구 실행 (playground 또는 docs 서버)
    if (
      ['execute_javascript', 'compare_outputs', 'explain_error', 'measure_performance'].includes(
        toolName
      )
    ) {
      // @ts-ignore - MCP 서버 내부 메서드 직접 호출
      const handler = (this.playgroundServer as any).server.requestHandlers.get(
        'tools/call'
      );
      if (!handler) throw new Error('Tool handler not found');

      const result = await handler(request);
      return result.content[0].text;
    } else if (['fetch_docs', 'search_examples'].includes(toolName)) {
      // @ts-ignore - MCP 서버 내부 메서드 직접 호출
      const handler = (this.docsServer as any).server.requestHandlers.get('tools/call');
      if (!handler) throw new Error('Tool handler not found');

      const result = await handler(request);
      return result.content[0].text;
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Singleton instance
export const mcpIntegration = new MCPIntegration();
