# Notion 학습 노트 자동 저장 가이드

## 📚 개요

claude-teaches-code에서 학습한 코드와 설명을 Notion에 자동으로 저장하는 기능입니다.

## 🎯 기능

- ✅ 코드 + 설명 자동 저장
- ✅ 핵심 개념, 주의사항, 다음 단계 포함
- ✅ 실행 결과 및 성능 데이터 저장
- ✅ 태그 및 프로그래밍 언어 자동 분류
- ✅ 날짜별 학습 이력 추적

---

## 🚀 설정 방법

### 1단계: Notion Integration 만들기

1. https://www.notion.so/my-integrations 접속
2. **"+ New integration"** 클릭
3. Integration 정보 입력:
   - **Name**: "Claude Teaches Code" (또는 원하는 이름)
   - **Logo**: 선택사항
   - **Associated workspace**: 사용할 워크스페이스 선택
4. **Submit** 클릭
5. **Internal Integration Secret** 복사 (나중에 사용)
   - 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxx`

### 2단계: Notion Database 만들기

1. Notion에서 새 페이지 생성
2. 페이지 제목: "Code Learning Notes" (또는 원하는 이름)
3. 페이지 안에서 `/database` 입력 → **Database - Inline** 선택
4. Database 속성 추가:
   - **Name** (Title) - 기본 제공
   - **Language** (Select) - JavaScript, Python, TypeScript 등
   - **Tags** (Multi-select) - Algorithm, Web, Backend 등
   - **Date** (Date)
   - **Avg Time (ms)** (Number)

5. Database ID 복사:
   - Database 우측 상단 **⋯** 클릭 → **Copy link**
   - URL 형식: `https://www.notion.so/workspace/{DATABASE_ID}?v=...`
   - `DATABASE_ID` 부분만 복사 (32자리 문자열)

### 3단계: Integration에 Database 권한 부여

1. Database 페이지에서 우측 상단 **⋯** 클릭
2. **Connections** → **Connect to** 클릭
3. 1단계에서 만든 Integration 선택
4. **Confirm** 클릭

---

## 💻 웹 앱에서 사용하기

### 처음 설정

1. 브라우저에서 http://localhost:3000 열기
2. 코드 생성 후 좌측 하단에 **"Notion에 학습 노트 저장"** 패널 확인
3. **톱니바퀴 아이콘** 클릭
4. 설정 입력:
   - **Integration Token**: 1단계에서 복사한 Secret
   - **Database ID**: 2단계에서 복사한 ID
5. **연결하기** 버튼 클릭
6. "Notion 연결 성공!" 메시지 확인

### 학습 노트 저장

1. 코드 생성 완료 후
2. **태그 입력** (예: "Algorithm, JavaScript, Sorting")
3. **"Notion에 저장"** 버튼 클릭
4. 저장 완료 후 자동으로 Notion 페이지 열림

---

## 📝 저장되는 내용

Notion 페이지에 다음 내용이 자동 저장됩니다:

```
┌─────────────────────────────────────┐
│ 📚 피보나치 함수 학습                │
│ 언어: JavaScript                    │
│ 태그: Algorithm, Recursion          │
│ 날짜: 2025-10-03                    │
│                                     │
│ ## 📝 코드                          │
│ function fibonacci(n) {             │
│   if (n <= 1) return n;             │
│   return fib(n-1) + fib(n-2);       │
│ }                                   │
│                                     │
│ ## 💡 설명                          │
│ 재귀 함수를 사용하여...             │
│                                     │
│ ## 🔑 핵심 개념                     │
│ • 재귀 함수                         │
│ • Base case                         │
│ • Recursive case                   │
│                                     │
│ ## ⚠️ 주의사항                      │
│ • 큰 숫자는 느림                    │
│                                     │
│ ## ⚡ 실행 결과                     │
│ ✅ 성공                             │
│ 출력: 0, 1, 1, 2, 3, 5, 8           │
│ 실행 시간: 2ms                      │
│                                     │
│ ## 🚀 다음 단계                     │
│ • 메모이제이션 적용                 │
│ • 동적 프로그래밍 학습              │
└─────────────────────────────────────┘
```

---

## 🔧 Claude Desktop에서 사용하기 (MCP)

### MCP 서버 실행

```bash
cd /Users/andrew/Thairon/Claude_Edu/claude-teaches-code
node backend/src/mcp/notion.ts
```

### Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-teaches-code-notion": {
      "command": "node",
      "args": [
        "/Users/andrew/Thairon/Claude_Edu/claude-teaches-code/backend/src/mcp/notion.ts"
      ]
    }
  }
}
```

### 사용 예시

```
사용자: Notion을 설정해줘
token: secret_xxxxx
databaseId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Claude: [configure_notion 도구 사용]
✅ Notion 연결 성공!

사용자: 방금 배운 피보나치 함수를 Notion에 저장해줘

Claude: [save_learning_note 도구 사용]
✅ Notion에 학습 노트 저장 완료!
페이지 URL: https://notion.so/...
```

---

## 🛠️ API 엔드포인트

### 1. Notion 설정

```bash
POST /api/notion/configure
```

**Request:**
```json
{
  "token": "secret_xxxxx",
  "databaseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notion 연결 성공",
  "user": "Bot Name",
  "databaseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### 2. 학습 노트 저장

```bash
POST /api/notion/save-note
```

**Request:**
```json
{
  "title": "피보나치 함수 학습",
  "code": "function fibonacci(n) { ... }",
  "language": "JavaScript",
  "explanation": "재귀 함수를 사용하여...",
  "keyConcepts": ["재귀", "Base case"],
  "warnings": ["큰 숫자는 느림"],
  "nextSteps": ["메모이제이션 적용"],
  "tags": ["Algorithm", "Recursion"],
  "executionResult": {
    "success": true,
    "output": "0, 1, 1, 2, 3, 5, 8",
    "executionTime": 2
  },
  "performanceData": {
    "average": 2.5,
    "min": 1.8,
    "max": 4.2
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notion에 학습 노트 저장 완료",
  "pageUrl": "https://notion.so/...",
  "pageId": "page-id"
}
```

### 3. Database 생성 (선택사항)

```bash
POST /api/notion/create-database
```

**Request:**
```json
{
  "parentPageId": "parent-page-id",
  "title": "Code Learning Notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "데이터베이스 생성 완료",
  "databaseId": "database-id",
  "databaseUrl": "https://notion.so/..."
}
```

---

## 🎯 사용 팁

### 효과적인 태그 사용

- **알고리즘**: `Algorithm`, `DataStructure`, `DynamicProgramming`
- **프레임워크**: `React`, `Vue`, `Express`
- **주제**: `Frontend`, `Backend`, `Database`
- **난이도**: `Beginner`, `Intermediate`, `Advanced`

### Database View 활용

Notion Database에서 다양한 View 만들기:

1. **언어별 분류**: Language 속성으로 그룹화
2. **날짜별 타임라인**: Date 속성으로 Timeline View
3. **태그별 필터**: Tags로 Filter View
4. **성능 순위**: Avg Time으로 Sort

### 자동화 팁

- 자주 사용하는 태그는 미리 입력해두기
- Database Template으로 일관된 형식 유지
- Notion의 Relation 기능으로 관련 노트 연결

---

## ❓ 문제 해결

### Integration Token 오류

**증상**: "Notion 연결 실패: Unauthorized"

**해결**:
1. Integration Token이 올바른지 확인
2. Integration이 Database에 연결되어 있는지 확인
3. Token이 만료되지 않았는지 확인

### Database ID 오류

**증상**: "Database ID가 필요합니다"

**해결**:
1. Database URL에서 ID를 정확히 복사했는지 확인
2. Database가 삭제되지 않았는지 확인
3. Integration이 해당 Database에 접근 권한이 있는지 확인

### 저장 실패

**증상**: "저장 실패: Could not find database"

**해결**:
1. Database에 Integration 권한 부여 확인
2. Database ID가 올바른지 확인
3. Notion 서비스 상태 확인

---

## 🔐 보안

- Integration Token은 **절대 공개하지 마세요**
- Token은 환경 변수로 관리하는 것이 안전합니다
- Database 공유 시 민감한 정보 포함 여부 확인

---

## 📚 더 알아보기

- [Notion API 문서](https://developers.notion.com/)
- [Integration 설정 가이드](https://www.notion.so/help/add-and-manage-integrations)
- [Database 속성 종류](https://www.notion.so/help/database-properties)

---

**💡 팁**: 학습한 내용을 Notion에 저장하면 나중에 복습하기 쉽고, 학습 이력을 추적할 수 있습니다!
