/**
 * Notion MCP Server
 * 학습한 코드와 설명을 Notion에 자동 저장
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@notionhq/client';

interface NotionConfig {
  auth: string; // Notion Integration Token
  databaseId?: string; // 기본 데이터베이스 ID
}

interface LearningNote {
  title: string;
  code: string;
  language: string;
  explanation: string;
  keyConcepts?: string[];
  warnings?: string[];
  nextSteps?: string[];
  tags?: string[];
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

export class NotionMCPServer {
  private server: Server;
  private notion: Client | null = null;
  private config: NotionConfig | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'claude-teaches-code-notion',
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

  private setupHandlers() {
    // 사용 가능한 도구 목록
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'configure_notion',
          description: 'Notion API 설정 (Integration Token과 Database ID)',
          inputSchema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'Notion Integration Token',
              },
              databaseId: {
                type: 'string',
                description: '학습 노트를 저장할 Database ID (선택사항)',
              },
            },
            required: ['token'],
          },
        },
        {
          name: 'save_learning_note',
          description: '학습한 코드와 설명을 Notion 페이지로 저장',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '학습 노트 제목',
              },
              code: {
                type: 'string',
                description: '코드 내용',
              },
              language: {
                type: 'string',
                description: '프로그래밍 언어',
              },
              explanation: {
                type: 'string',
                description: '코드 설명',
              },
              keyConcepts: {
                type: 'array',
                items: { type: 'string' },
                description: '핵심 개념',
              },
              warnings: {
                type: 'array',
                items: { type: 'string' },
                description: '주의사항',
              },
              nextSteps: {
                type: 'array',
                items: { type: 'string' },
                description: '다음 단계',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: '태그',
              },
              executionResult: {
                type: 'object',
                description: '코드 실행 결과',
              },
              performanceData: {
                type: 'object',
                description: '성능 측정 데이터',
              },
              databaseId: {
                type: 'string',
                description: '저장할 Database ID (선택사항, 기본값 사용)',
              },
            },
            required: ['title', 'code', 'language', 'explanation'],
          },
        },
        {
          name: 'create_learning_database',
          description: '학습 노트 전용 Notion 데이터베이스 생성',
          inputSchema: {
            type: 'object',
            properties: {
              parentPageId: {
                type: 'string',
                description: '데이터베이스를 생성할 부모 페이지 ID',
              },
              title: {
                type: 'string',
                description: '데이터베이스 제목 (기본값: "Code Learning Notes")',
              },
            },
            required: ['parentPageId'],
          },
        },
        {
          name: 'search_learning_notes',
          description: '저장된 학습 노트 검색',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '검색어',
              },
              tag: {
                type: 'string',
                description: '태그로 필터링',
              },
              language: {
                type: 'string',
                description: '프로그래밍 언어로 필터링',
              },
            },
          },
        },
      ],
    }));

    // 도구 실행
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'configure_notion':
            return await this.configureNotion(args as any);

          case 'save_learning_note':
            return await this.saveLearningNote(args as any);

          case 'create_learning_database':
            return await this.createLearningDatabase(args as any);

          case 'search_learning_notes':
            return await this.searchLearningNotes(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ 오류 발생: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  private async configureNotion(args: { token: string; databaseId?: string }) {
    try {
      this.config = {
        auth: args.token,
        databaseId: args.databaseId,
      };

      this.notion = new Client({ auth: args.token });

      // 연결 테스트
      const user = await this.notion.users.me({});

      return {
        content: [
          {
            type: 'text',
            text: `✅ Notion 연결 성공!\n\n사용자: ${(user as any).name || (user as any).bot?.name || 'Bot'}\n${args.databaseId ? `기본 Database ID: ${args.databaseId}` : '데이터베이스 ID 미설정 (나중에 지정 가능)'}`,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Notion 연결 실패: ${error.message}`);
    }
  }

  private async saveLearningNote(args: LearningNote & { databaseId?: string }) {
    if (!this.notion) {
      throw new Error('Notion이 설정되지 않았습니다. configure_notion을 먼저 실행하세요.');
    }

    const databaseId = args.databaseId || this.config?.databaseId;
    if (!databaseId) {
      throw new Error('Database ID가 필요합니다. databaseId를 인자로 전달하거나 configure_notion으로 기본값을 설정하세요.');
    }

    try {
      // Notion 페이지 생성
      const page = await this.notion.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: {
          // 제목
          Name: {
            title: [
              {
                text: {
                  content: args.title,
                },
              },
            ],
          },
          // 프로그래밍 언어
          Language: {
            select: {
              name: args.language,
            },
          },
          // 태그
          Tags: args.tags
            ? {
                multi_select: args.tags.map((tag) => ({ name: tag })),
              }
            : { multi_select: [] },
          // 날짜
          Date: {
            date: {
              start: new Date().toISOString(),
            },
          },
          // 성능 (있으면)
          ...(args.performanceData && {
            'Avg Time (ms)': {
              number: args.performanceData.average,
            },
          }),
        },
        children: [
          // 코드 블록
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '📝 코드' } }],
            },
          },
          {
            object: 'block',
            type: 'code',
            code: {
              language: this.mapLanguage(args.language),
              rich_text: [
                {
                  type: 'text',
                  text: { content: args.code },
                },
              ],
            },
          },
          // 설명
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '💡 설명' } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: args.explanation },
                },
              ],
            },
          },
          // 핵심 개념
          ...(args.keyConcepts && args.keyConcepts.length > 0
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_3' as const,
                  heading_3: {
                    rich_text: [{ type: 'text' as const, text: { content: '🔑 핵심 개념' } }],
                  },
                },
                ...args.keyConcepts.map((concept) => ({
                  object: 'block' as const,
                  type: 'bulleted_list_item' as const,
                  bulleted_list_item: {
                    rich_text: [{ type: 'text' as const, text: { content: concept } }],
                  },
                })),
              ]
            : []),
          // 주의사항
          ...(args.warnings && args.warnings.length > 0
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_3' as const,
                  heading_3: {
                    rich_text: [{ type: 'text' as const, text: { content: '⚠️ 주의사항' } }],
                  },
                },
                ...args.warnings.map((warning) => ({
                  object: 'block' as const,
                  type: 'bulleted_list_item' as const,
                  bulleted_list_item: {
                    rich_text: [{ type: 'text' as const, text: { content: warning } }],
                  },
                })),
              ]
            : []),
          // 실행 결과
          ...(args.executionResult
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_3' as const,
                  heading_3: {
                    rich_text: [{ type: 'text' as const, text: { content: '⚡ 실행 결과' } }],
                  },
                },
                {
                  object: 'block' as const,
                  type: 'code' as const,
                  code: {
                    language: 'plain text' as any,
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: {
                          content: args.executionResult.success
                            ? `✅ 성공\n출력: ${args.executionResult.output}\n실행 시간: ${args.executionResult.executionTime}ms`
                            : `❌ 실패`,
                        },
                      },
                    ],
                  },
                },
              ]
            : []),
          // 다음 단계
          ...(args.nextSteps && args.nextSteps.length > 0
            ? [
                {
                  object: 'block' as const,
                  type: 'heading_3' as const,
                  heading_3: {
                    rich_text: [{ type: 'text' as const, text: { content: '🚀 다음 단계' } }],
                  },
                },
                ...args.nextSteps.map((step) => ({
                  object: 'block' as const,
                  type: 'bulleted_list_item' as const,
                  bulleted_list_item: {
                    rich_text: [{ type: 'text' as const, text: { content: step } }],
                  },
                })),
              ]
            : []),
        ],
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Notion에 학습 노트 저장 완료!\n\n페이지 제목: ${args.title}\nURL: ${(page as any).url}\n언어: ${args.language}\n${args.tags ? `태그: ${args.tags.join(', ')}` : ''}`,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Notion 저장 실패: ${error.message}`);
    }
  }

  private async createLearningDatabase(args: { parentPageId: string; title?: string }) {
    if (!this.notion) {
      throw new Error('Notion이 설정되지 않았습니다.');
    }

    try {
      const database = await this.notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: args.parentPageId,
        },
        title: [
          {
            type: 'text',
            text: {
              content: args.title || 'Code Learning Notes',
            },
          },
        ],
        properties: {
          Name: {
            title: {},
          },
          Language: {
            select: {
              options: [
                { name: 'JavaScript', color: 'yellow' },
                { name: 'Python', color: 'blue' },
                { name: 'TypeScript', color: 'green' },
                { name: 'Java', color: 'red' },
                { name: 'C++', color: 'purple' },
                { name: 'Go', color: 'pink' },
                { name: 'Rust', color: 'orange' },
              ],
            },
          },
          Tags: {
            multi_select: {
              options: [
                { name: 'Algorithm', color: 'blue' },
                { name: 'Data Structure', color: 'green' },
                { name: 'Web', color: 'yellow' },
                { name: 'Backend', color: 'red' },
                { name: 'Frontend', color: 'pink' },
                { name: 'Performance', color: 'orange' },
              ],
            },
          },
          Date: {
            date: {},
          },
          'Avg Time (ms)': {
            number: {
              format: 'number_with_commas',
            },
          },
        },
      });

      // 기본 데이터베이스로 설정
      if (this.config) {
        this.config.databaseId = database.id;
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ 학습 노트 데이터베이스 생성 완료!\n\nDatabase ID: ${database.id}\nURL: ${(database as any).url}\n\n이 ID를 configure_notion의 databaseId로 설정하거나\nsave_learning_note 호출 시 사용하세요.`,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`데이터베이스 생성 실패: ${error.message}`);
    }
  }

  private async searchLearningNotes(args: { query?: string; tag?: string; language?: string }) {
    if (!this.notion) {
      throw new Error('Notion이 설정되지 않았습니다.');
    }

    const databaseId = this.config?.databaseId;
    if (!databaseId) {
      throw new Error('Database ID가 필요합니다.');
    }

    try {
      const filter: any = { and: [] };

      if (args.language) {
        filter.and.push({
          property: 'Language',
          select: {
            equals: args.language,
          },
        });
      }

      if (args.tag) {
        filter.and.push({
          property: 'Tags',
          multi_select: {
            contains: args.tag,
          },
        });
      }

      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter: filter.and.length > 0 ? filter : undefined,
      });

      const results = response.results.map((page: any) => {
        const title = page.properties.Name?.title[0]?.text?.content || 'Untitled';
        const language = page.properties.Language?.select?.name || 'Unknown';
        const tags = page.properties.Tags?.multi_select?.map((t: any) => t.name) || [];
        const date = page.properties.Date?.date?.start || '';
        const url = page.url;

        return `📚 ${title}\n  언어: ${language}\n  태그: ${tags.join(', ')}\n  날짜: ${date}\n  URL: ${url}`;
      });

      return {
        content: [
          {
            type: 'text',
            text:
              results.length > 0
                ? `✅ ${results.length}개의 학습 노트 발견:\n\n${results.join('\n\n')}`
                : '검색 결과 없음',
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`검색 실패: ${error.message}`);
    }
  }

  private mapLanguage(lang: string): any {
    const languageMap: { [key: string]: string } = {
      javascript: 'javascript',
      js: 'javascript',
      typescript: 'typescript',
      ts: 'typescript',
      python: 'python',
      py: 'python',
      java: 'java',
      'c++': 'c++',
      cpp: 'c++',
      go: 'go',
      rust: 'rust',
      ruby: 'ruby',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
    };

    return languageMap[lang.toLowerCase()] || 'plain text';
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Notion MCP Server running');
  }
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NotionMCPServer();
  server.run().catch(console.error);
}
