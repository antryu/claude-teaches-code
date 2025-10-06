import express from 'express';
import { Client } from '@notionhq/client';

const router = express.Router();

// Notion 클라이언트 (환경변수 또는 요청에서 토큰 받기)
let notionClient: Client | null = null;
let defaultDatabaseId: string | null = null;

// Database ID 추출 함수 (URL에서 UUID만 추출)
function extractDatabaseId(input: string): string {
  // URL 형식: https://www.notion.so/workspace/DATABASE_ID?v=...
  // 또는 DATABASE_ID만

  // 이미 UUID 형식이면 그대로 반환
  const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  const cleanInput = input.replace(/-/g, '');

  if (uuidRegex.test(input) || /^[0-9a-f]{32}$/i.test(cleanInput)) {
    // 하이픈 제거된 32자리 UUID를 표준 형식으로 변환
    if (cleanInput.length === 32) {
      return `${cleanInput.slice(0, 8)}-${cleanInput.slice(8, 12)}-${cleanInput.slice(12, 16)}-${cleanInput.slice(16, 20)}-${cleanInput.slice(20)}`;
    }
    return input;
  }

  // URL에서 추출
  const match = input.match(/([0-9a-f]{32})/i);
  if (match) {
    const id = match[1];
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  }

  return input; // 그대로 반환 (에러는 Notion API에서 발생)
}

// Notion 설정
router.post('/configure', async (req, res) => {
  try {
    const { token, databaseId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Notion Integration Token이 필요합니다.',
      });
    }

    notionClient = new Client({ auth: token });
    defaultDatabaseId = databaseId ? extractDatabaseId(databaseId) : null;

    // 연결 테스트
    const user = await notionClient.users.me({});

    res.json({
      success: true,
      message: 'Notion 연결 성공',
      user: (user as any).name || (user as any).bot?.name || 'Bot',
      databaseId: defaultDatabaseId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Notion 연결 실패: ${error.message}`,
    });
  }
});

// 학습 노트 저장
router.post('/save-note', async (req, res) => {
  try {
    if (!notionClient) {
      return res.status(400).json({
        success: false,
        error: 'Notion is not configured. Please call /api/notion/configure first.',
      });
    }

    const {
      title,
      code,
      language,
      explanation,
      keyConcepts,
      warnings,
      nextSteps,
      tags,
      executionResult,
      performanceData,
      databaseId,
    } = req.body;

    const targetDatabaseId = databaseId ? extractDatabaseId(databaseId) : defaultDatabaseId;

    // Database ID가 없으면 간단한 페이지로 저장
    if (!targetDatabaseId) {
      console.log('No database ID, creating simple page');

      const page = await notionClient.pages.create({
        parent: {
          type: 'page_id',
          page_id: await getDefaultPageId(notionClient),
        },
        properties: {
          title: {
            title: [{ text: { content: title || 'Code Learning Note' } }],
          },
        },
        children: buildPageContent(code, language, explanation, keyConcepts, warnings, nextSteps, executionResult),
      });

      return res.json({
        success: true,
        message: 'Successfully saved to Notion as a page!',
        pageUrl: (page as any).url,
        pageId: page.id,
      });
    }

    console.log('Using Database ID:', targetDatabaseId);

    // Database 구조 확인 및 동적 속성 매핑
    let database;
    try {
      database = await notionClient.databases.retrieve({
        database_id: targetDatabaseId,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: `Database access failed: ${error.message}. Make sure the Integration is connected to this Database.`,
      });
    }

    const dbProperties = (database as any)?.properties;
    if (!dbProperties || typeof dbProperties !== 'object') {
      return res.status(500).json({
        success: false,
        error: 'Cannot retrieve database properties. Please verify the Database ID and Integration connection.',
      });
    }

    console.log('Available properties:', Object.keys(dbProperties));

    // Database에 있는 속성만 사용
    const properties: any = {};

    // 1. Title 속성 찾기 (필수)
    const titleProp = Object.entries(dbProperties).find(
      ([_, value]: [string, any]) => value.type === 'title'
    );
    if (titleProp) {
      properties[titleProp[0]] = {
        title: [{ text: { content: title } }],
      };
    }

    // 2. Language 속성 (선택)
    if (dbProperties.Language?.type === 'select') {
      properties.Language = { select: { name: language } };
    }

    // 3. Tags 속성 (선택)
    if (dbProperties.Tags?.type === 'multi_select' && tags?.length > 0) {
      properties.Tags = { multi_select: tags.map((tag: string) => ({ name: tag })) };
    }

    // 4. Date 속성 (선택)
    if (dbProperties.Date?.type === 'date') {
      properties.Date = { date: { start: new Date().toISOString() } };
    }

    // 5. Performance 속성 (선택)
    if (dbProperties['Avg Time (ms)']?.type === 'number' && performanceData) {
      properties['Avg Time (ms)'] = { number: performanceData.average };
    }

    const page = await notionClient.pages.create({
      parent: {
        database_id: targetDatabaseId,
      },
      properties,
      children: [
        ...buildPageContent(code, language, explanation, keyConcepts, warnings, nextSteps, executionResult),
      ],
    });

    res.json({
      success: true,
      message: 'Successfully saved to Notion!',
      pageUrl: (page as any).url,
      pageId: page.id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Failed to save: ${error.message}`,
    });
  }
});

// 데이터베이스 생성
router.post('/create-database', async (req, res) => {
  try {
    if (!notionClient) {
      return res.status(400).json({
        success: false,
        error: 'Notion이 설정되지 않았습니다.',
      });
    }

    const { parentPageId, title } = req.body;

    if (!parentPageId) {
      return res.status(400).json({
        success: false,
        error: 'Parent Page ID가 필요합니다.',
      });
    }

    const database = await notionClient.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: { content: title || 'Code Learning Notes' },
        },
      ],
      properties: {
        Name: { title: {} },
        Language: {
          select: {
            options: [
              { name: 'JavaScript', color: 'yellow' },
              { name: 'Python', color: 'blue' },
              { name: 'TypeScript', color: 'green' },
              { name: 'Java', color: 'red' },
            ],
          },
        },
        Tags: {
          multi_select: {
            options: [
              { name: 'Algorithm', color: 'blue' },
              { name: 'Data Structure', color: 'green' },
              { name: 'Web', color: 'yellow' },
            ],
          },
        },
        Date: { date: {} },
        'Avg Time (ms)': { number: { format: 'number_with_commas' } },
      },
    });

    defaultDatabaseId = database.id;

    res.json({
      success: true,
      message: '데이터베이스 생성 완료',
      databaseId: database.id,
      databaseUrl: (database as any).url,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `생성 실패: ${error.message}`,
    });
  }
});

function mapLanguage(lang: string): any {
  const languageMap: { [key: string]: string } = {
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    python: 'python',
    py: 'python',
    java: 'java',
  };
  return languageMap[lang.toLowerCase()] || 'plain text';
}

// Get default page ID from search results
async function getDefaultPageId(client: Client): Promise<string> {
  const response = await client.search({
    filter: { property: 'object', value: 'page' },
    page_size: 1,
  });

  if (response.results.length === 0) {
    throw new Error('No accessible pages found. Please create a page in Notion and share it with the Integration.');
  }

  return response.results[0].id;
}

// Split text into chunks of max 2000 characters
function splitText(text: string, maxLength: number = 2000): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at newline
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // No good newline found, split at maxLength
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex);
  }

  return chunks;
}

// Build page content blocks
function buildPageContent(
  code: string,
  language: string,
  explanation: string,
  keyConcepts?: string[],
  warnings?: string[],
  nextSteps?: string[],
  executionResult?: any
): any[] {
  const codeChunks = splitText(code, 2000);
  const explanationChunks = splitText(explanation, 2000);

  return [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📝 Code' } }],
      },
    },
    // Split code into multiple blocks if needed
    ...codeChunks.map((chunk, index) => ({
      object: 'block' as const,
      type: 'code' as const,
      code: {
        language: mapLanguage(language),
        rich_text: [{ type: 'text', text: { content: chunk } }],
      },
    })),
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '💡 Explanation' } }],
      },
    },
    // Split explanation into multiple blocks if needed
    ...explanationChunks.map((chunk) => ({
      object: 'block' as const,
      type: 'paragraph' as const,
      paragraph: {
        rich_text: [{ type: 'text', text: { content: chunk } }],
      },
    })),
    ...(keyConcepts && keyConcepts.length > 0
      ? [
          {
            object: 'block' as const,
            type: 'heading_3' as const,
            heading_3: {
              rich_text: [{ type: 'text' as const, text: { content: '🔑 Key Concepts' } }],
            },
          },
          ...keyConcepts.map((concept: string) => ({
            object: 'block' as const,
            type: 'bulleted_list_item' as const,
            bulleted_list_item: {
              rich_text: [{ type: 'text' as const, text: { content: concept } }],
            },
          })),
        ]
      : []),
    ...(warnings && warnings.length > 0
      ? [
          {
            object: 'block' as const,
            type: 'heading_3' as const,
            heading_3: {
              rich_text: [{ type: 'text' as const, text: { content: '⚠️ Warnings' } }],
            },
          },
          ...warnings.map((warning: string) => ({
            object: 'block' as const,
            type: 'bulleted_list_item' as const,
            bulleted_list_item: {
              rich_text: [{ type: 'text' as const, text: { content: warning } }],
            },
          })),
        ]
      : []),
    ...(executionResult
      ? [
          {
            object: 'block' as const,
            type: 'heading_3' as const,
            heading_3: {
              rich_text: [{ type: 'text' as const, text: { content: '⚡ Execution Result' } }],
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
                    content: executionResult.success
                      ? `✅ Success\nOutput: ${executionResult.output}\nExecution Time: ${executionResult.executionTime}ms`
                      : `❌ Failed`,
                  },
                },
              ],
            },
          },
        ]
      : []),
    ...(nextSteps && nextSteps.length > 0
      ? [
          {
            object: 'block' as const,
            type: 'heading_3' as const,
            heading_3: {
              rich_text: [{ type: 'text' as const, text: { content: '🚀 Next Steps' } }],
            },
          },
          ...nextSteps.map((step: string) => ({
            object: 'block' as const,
            type: 'bulleted_list_item' as const,
            bulleted_list_item: {
              rich_text: [{ type: 'text' as const, text: { content: step } }],
            },
          })),
        ]
      : []),
  ];
}

export default router;
