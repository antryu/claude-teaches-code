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
        error: 'Notion이 설정되지 않았습니다. /api/notion/configure를 먼저 호출하세요.',
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
    if (!targetDatabaseId) {
      return res.status(400).json({
        success: false,
        error: 'Database ID가 필요합니다.',
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
        error: `Database 접근 실패: ${error.message}. Integration이 이 Database에 연결되어 있는지 확인하세요.`,
      });
    }

    const dbProperties = (database as any)?.properties;
    if (!dbProperties || typeof dbProperties !== 'object') {
      return res.status(500).json({
        success: false,
        error: 'Database 속성을 가져올 수 없습니다. Database ID가 올바른지 확인하세요.',
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
            language: mapLanguage(language),
            rich_text: [{ type: 'text', text: { content: code } }],
          },
        },
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
            rich_text: [{ type: 'text', text: { content: explanation } }],
          },
        },
        ...(keyConcepts && keyConcepts.length > 0
          ? [
              {
                object: 'block' as const,
                type: 'heading_3' as const,
                heading_3: {
                  rich_text: [{ type: 'text' as const, text: { content: '🔑 핵심 개념' } }],
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
                  rich_text: [{ type: 'text' as const, text: { content: '⚠️ 주의사항' } }],
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
                        content: executionResult.success
                          ? `✅ 성공\n출력: ${executionResult.output}\n실행 시간: ${executionResult.executionTime}ms`
                          : `❌ 실패`,
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
                  rich_text: [{ type: 'text' as const, text: { content: '🚀 다음 단계' } }],
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
      ],
    });

    res.json({
      success: true,
      message: 'Notion에 학습 노트 저장 완료',
      pageUrl: (page as any).url,
      pageId: page.id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `저장 실패: ${error.message}`,
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

export default router;
