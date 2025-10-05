# Claude Teaches Code 🎓

[![English](https://img.shields.io/badge/lang-English-blue.svg)](#english) [![한국어](https://img.shields.io/badge/lang-한국어-red.svg)](#korean)

<a name="english"></a>

## English

A full-stack AI-powered educational platform that teaches programming concepts using Claude Sonnet 4.5 with Extended Thinking. Features three specialized AI agents, MCP server integration, and a beautiful bilingual interface.

### ✨ Key Features

- **🤖 Three AI Agents**
  - **Orchestrator**: Analyzes intent and routes requests intelligently
  - **CodeGenAgent**: Generates educational code with reasoning tags
  - **ExplainAgent**: Provides deep explanations using Extended Thinking (10K tokens)

- **📚 Documentation MCP Server**
  - DevDocs API integration for official documentation
  - GitHub code search for real-world examples
  - Intelligent caching (1-hour TTL)

- **🎨 Beautiful UI**
  - Monaco code editor with line-by-line "Why?" explanations
  - Animated workflow visualizer with Framer Motion
  - Collapsible Extended Thinking panel
  - Real-time SSE streaming
  - Dark/Light theme toggle
  - Responsive mobile design

- **🌐 Bilingual Support**
  - Complete English & Korean interface
  - Bilingual AI agent system prompts
  - react-i18next integration

### 🏗️ Architecture

```
claude-teaches-code/
├── backend/              # Node.js + TypeScript
│   ├── src/
│   │   ├── agents/      # AI agents (Orchestrator, CodeGen, Explain)
│   │   ├── mcp/         # MCP server for documentation
│   │   ├── routes/      # API endpoints
│   │   ├── locales/     # Bilingual system prompts
│   │   └── types/       # TypeScript types
│   └── package.json
│
└── frontend/            # React + TypeScript + Vite
    ├── src/
    │   ├── components/  # React components
    │   ├── i18n/        # Internationalization
    │   ├── services/    # API services
    │   └── types/       # TypeScript types
    └── package.json
```

### 🚀 Getting Started

#### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))

#### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd claude-teaches-code
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
```

3. **Setup Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### 📡 API Endpoints

#### POST `/api/generate`
Generate code with streaming response (SSE)

**Request:**
```json
{
  "prompt": "Create a React component for a todo list",
  "language": "en",
  "context": "optional context"
}
```

**Response:** Server-Sent Events stream with workflow, thinking, and code

#### POST `/api/explain-line`
Explain a specific line of code

**Request:**
```json
{
  "code": "const result = array.map(x => x * 2)",
  "lineNumber": 1,
  "language": "en",
  "programmingLanguage": "javascript"
}
```

#### POST `/api/alternatives`
Get alternative implementations

**Request:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "en",
  "programmingLanguage": "javascript"
}
```

#### GET `/api/health`
Health check endpoint

### 🎯 Usage Examples

#### Generate Educational Code
```
Prompt: "Create a secure login form in React with validation"

1. Orchestrator analyzes intent → "generate"
2. CodeGenAgent generates React component with:
   - Inline educational comments
   - Security best practices
   - <thinking> tags showing reasoning
3. Results display with:
   - Syntax-highlighted code
   - Key decisions explained
   - Suggested next steps
```

#### Interactive Line Explanations
1. Click the "?" icon in the glyph margin of any code line
2. ExplainAgent analyzes with Extended Thinking (10K tokens)
3. See:
   - Deep explanation with analogies
   - Key concepts highlighted
   - Common mistakes to avoid

#### Alternative Implementations
1. Generate code
2. Click "Show Alternatives"
3. Get multiple approaches with pros/cons analysis

### 🧠 Extended Thinking

Claude's Extended Thinking feature provides deep analysis with 10K token budget:

- **Visible Process**: See the AI's reasoning in collapsible panels
- **Educational Value**: Understand WHY, not just WHAT
- **Deep Concepts**: Complex topics broken down systematically

### 🛠️ Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- @anthropic-ai/sdk (Claude Sonnet 4.5)
- @modelcontextprotocol/sdk (MCP server)
- Server-Sent Events (SSE) for streaming

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Monaco Editor (code editor)
- Framer Motion (animations)
- react-i18next (internationalization)
- react-markdown (Markdown rendering)

### 🌍 Internationalization

Switch between English and Korean seamlessly:
- UI translations via react-i18next
- Bilingual AI system prompts
- Locale-aware API responses

### 📝 Environment Variables

**Backend (.env):**
```env
ANTHROPIC_API_KEY=your_key_here
PORT=3001
DEFAULT_LANGUAGE=en
EXTENDED_THINKING_BUDGET=10000
CACHE_TTL=3600
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
```

### 🔧 Development

**Backend:**
```bash
npm run dev      # Development with hot reload
npm run build    # Build TypeScript
npm run start    # Production mode
```

**Frontend:**
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### 🐛 Troubleshooting

**Connection Failed:**
- Ensure backend is running on port 3001
- Check ANTHROPIC_API_KEY is valid
- Verify CORS is enabled

**Streaming Issues:**
- SSE requires HTTP/1.1 or HTTP/2
- Check browser console for errors
- Verify proxy configuration in vite.config.ts

### 📄 License

MIT License - feel free to use for educational purposes!

### 🤝 Contributing

Contributions welcome! Please open issues or PRs.

---

<a name="korean"></a>

## 한국어

Claude Sonnet 4.5의 Extended Thinking을 활용하여 프로그래밍 개념을 가르치는 풀스택 AI 교육 플랫폼입니다. 세 가지 전문 AI 에이전트, MCP 서버 통합, 그리고 아름다운 이중 언어 인터페이스를 제공합니다.

### ✨ 주요 기능

- **🤖 세 가지 AI 에이전트**
  - **조율자(Orchestrator)**: 의도를 분석하고 요청을 지능적으로 라우팅
  - **코드생성기(CodeGenAgent)**: 추론 태그와 함께 교육용 코드 생성
  - **설명자(ExplainAgent)**: Extended Thinking을 사용한 깊이 있는 설명 (10K 토큰)

- **📚 문서 MCP 서버**
  - DevDocs API 통합으로 공식 문서 제공
  - GitHub 코드 검색으로 실제 예제 제공
  - 지능형 캐싱 (1시간 TTL)

- **🎨 아름다운 UI**
  - Monaco 코드 에디터와 줄별 "왜?" 설명
  - Framer Motion을 활용한 애니메이션 워크플로우 시각화
  - 접을 수 있는 Extended Thinking 패널
  - 실시간 SSE 스트리밍
  - 다크/라이트 테마 전환
  - 반응형 모바일 디자인

- **🌐 이중 언어 지원**
  - 완전한 한국어 & 영어 인터페이스
  - 이중 언어 AI 에이전트 시스템 프롬프트
  - react-i18next 통합

### 🏗️ 아키텍처

```
claude-teaches-code/
├── backend/              # Node.js + TypeScript
│   ├── src/
│   │   ├── agents/      # AI 에이전트 (조율자, 코드생성기, 설명자)
│   │   ├── mcp/         # 문서용 MCP 서버
│   │   ├── routes/      # API 엔드포인트
│   │   ├── locales/     # 이중 언어 시스템 프롬프트
│   │   └── types/       # TypeScript 타입
│   └── package.json
│
└── frontend/            # React + TypeScript + Vite
    ├── src/
    │   ├── components/  # React 컴포넌트
    │   ├── i18n/        # 국제화
    │   ├── services/    # API 서비스
    │   └── types/       # TypeScript 타입
    └── package.json
```

### 🚀 시작하기

#### 사전 요구사항

- Node.js 18+ 및 npm
- Anthropic API 키 ([여기서 발급](https://console.anthropic.com/))

#### 설치

1. **저장소 클론**
```bash
git clone <repository-url>
cd claude-teaches-code
```

2. **백엔드 설정**
```bash
cd backend
npm install
cp .env.example .env
# .env를 편집하고 ANTHROPIC_API_KEY를 추가하세요
npm run dev
```

3. **프론트엔드 설정** (새 터미널에서)
```bash
cd frontend
npm install
npm run dev
```

4. **애플리케이션 접속**
- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:3001
- 상태 확인: http://localhost:3001/api/health

### 📡 API 엔드포인트

#### POST `/api/generate`
스트리밍 응답으로 코드 생성 (SSE)

**요청:**
```json
{
  "prompt": "할 일 목록을 위한 React 컴포넌트 만들기",
  "language": "ko",
  "context": "선택적 컨텍스트"
}
```

**응답:** 워크플로우, 사고 과정, 코드를 포함한 Server-Sent Events 스트림

#### POST `/api/explain-line`
특정 코드 줄 설명

**요청:**
```json
{
  "code": "const result = array.map(x => x * 2)",
  "lineNumber": 1,
  "language": "ko",
  "programmingLanguage": "javascript"
}
```

#### POST `/api/alternatives`
대체 구현 방법 얻기

**요청:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "ko",
  "programmingLanguage": "javascript"
}
```

#### GET `/api/health`
상태 확인 엔드포인트

### 🎯 사용 예제

#### 교육용 코드 생성
```
프롬프트: "검증 기능이 있는 안전한 React 로그인 폼 만들기"

1. 조율자가 의도 분석 → "생성"
2. 코드생성기가 다음을 포함한 React 컴포넌트 생성:
   - 교육용 인라인 주석
   - 보안 모범 사례
   - 추론 과정을 보여주는 <thinking> 태그
3. 결과 표시:
   - 구문 강조된 코드
   - 주요 결정 사항 설명
   - 제안된 다음 단계
```

#### 대화형 줄 설명
1. 코드의 모든 줄에 있는 여백의 "?" 아이콘 클릭
2. 설명자가 Extended Thinking으로 분석 (10K 토큰)
3. 확인 가능:
   - 비유를 포함한 깊이 있는 설명
   - 강조된 핵심 개념
   - 피해야 할 일반적인 실수

#### 대체 구현
1. 코드 생성
2. "대안 보기" 클릭
3. 장단점 분석과 함께 여러 접근 방식 확인

### 🧠 Extended Thinking

Claude의 Extended Thinking 기능은 10K 토큰 예산으로 깊이 있는 분석을 제공합니다:

- **가시적인 프로세스**: 접을 수 있는 패널에서 AI의 추론 확인
- **교육적 가치**: 무엇인지가 아니라 왜 그런지 이해
- **깊이 있는 개념**: 복잡한 주제를 체계적으로 분해

### 🛠️ 기술 스택

**백엔드:**
- Node.js + TypeScript
- Express.js
- @anthropic-ai/sdk (Claude Sonnet 4.5)
- @modelcontextprotocol/sdk (MCP 서버)
- Server-Sent Events (SSE) 스트리밍

**프론트엔드:**
- React 19 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- Monaco Editor (코드 에디터)
- Framer Motion (애니메이션)
- react-i18next (국제화)
- react-markdown (마크다운 렌더링)

### 🌍 국제화

영어와 한국어를 원활하게 전환:
- react-i18next를 통한 UI 번역
- 이중 언어 AI 시스템 프롬프트
- 로케일 인식 API 응답

### 📝 환경 변수

**백엔드 (.env):**
```env
ANTHROPIC_API_KEY=your_key_here
PORT=3001
DEFAULT_LANGUAGE=ko
EXTENDED_THINKING_BUDGET=10000
CACHE_TTL=3600
```

**프론트엔드 (.env):**
```env
VITE_API_URL=http://localhost:3001
```

### 🔧 개발

**백엔드:**
```bash
npm run dev      # 핫 리로드 개발
npm run build    # TypeScript 빌드
npm run start    # 프로덕션 모드
```

**프론트엔드:**
```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 프로덕션 빌드 미리보기
```

### 🐛 문제 해결

**연결 실패:**
- 백엔드가 포트 3001에서 실행 중인지 확인
- ANTHROPIC_API_KEY가 유효한지 확인
- CORS가 활성화되어 있는지 확인

**스트리밍 문제:**
- SSE는 HTTP/1.1 또는 HTTP/2 필요
- 브라우저 콘솔에서 오류 확인
- vite.config.ts의 프록시 설정 확인

### 📄 라이선스

MIT 라이선스 - 교육 목적으로 자유롭게 사용하세요!

### 🤝 기여

기여를 환영합니다! 이슈나 PR을 열어주세요.

---

## 🚀 Demo Examples

### Example 1: Generate a React Component
**Prompt (English):**
```
Create a reusable Button component in React with TypeScript that supports different sizes and variants
```

**Prompt (한국어):**
```
다양한 크기와 변형을 지원하는 재사용 가능한 React 버튼 컴포넌트를 TypeScript로 만들기
```

### Example 2: Explain Complex Concept
**Prompt (English):**
```
Explain how async/await works in JavaScript with the event loop
```

**Prompt (한국어):**
```
JavaScript의 이벤트 루프와 함께 async/await가 어떻게 작동하는지 설명
```

### Example 3: Get Alternative Implementations
**Code:**
```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**Action:** Click "Show Alternatives" / "대안 보기"

---

**Built with ❤️ using Claude Sonnet 4.5 and Extended Thinking**
