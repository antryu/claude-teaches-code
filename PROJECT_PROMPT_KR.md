# Claude 코드 교실 - 전체 프로젝트 프롬프트

## 프로젝트 개요
AI 기반 코드 학습 도우미 "Claude Teaches Code"를 만듭니다. 상세한 설명과 함께 코드를 생성하고, 대화형 코드 실행을 지원하며, 결과를 Notion에 저장할 수 있습니다.

## 기술 스택

### 프론트엔드
- **프레임워크**: React 19 + TypeScript + Vite
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: Lucide React 아이콘
- **코드 에디터**: Monaco Editor (@monaco-editor/react)
- **Python 런타임**: Pyodide (브라우저 기반 Python)
- **마크다운**: react-markdown, remark-gfm
- **i18n**: react-i18next (영어/한국어 지원)

### 백엔드
- **런타임**: Node.js + TypeScript
- **프레임워크**: Express
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929) with Extended Thinking
- **개발 도구**: tsx (TypeScript 실행), nodemon

## 핵심 기능

### 1. 지능형 코드 생성
- 멀티 에이전트 아키텍처 (Orchestrator, CodeGen, Explain)
- 심층 분석을 위한 Extended Thinking (10,000 토큰 예산)
- 실시간 스트리밍 응답
- 코드 내용에서 프로그래밍 언어 자동 감지
- 에이전트 진행 상황을 보여주는 워크플로우 시각화

### 2. 대화형 코드 실행
- **JavaScript**: console.log 캡처와 함께 브라우저 샌드박스에서 실행
- **Python**: 브라우저에서 Pyodide를 사용하여 실행
- 타이밍과 함께 실행 결과 표시
- 에러 처리 및 출력 포맷팅

### 3. 라인별 설명
- 코드 라인을 클릭하여 즉시 설명 확인
- 오른쪽 패널에 설명 표시
- 문맥 분석을 위해 Claude API 사용

### 4. Notion 통합
- 생성된 코드와 설명을 Notion 데이터베이스에 저장
- 실행 결과 및 메타데이터 포함
- 원클릭 저장 기능

### 5. 국제화
- 기본 언어: 영어
- 한국어 번역 지원
- 헤더의 언어 전환 버튼
- 모든 UI 컴포넌트 완전 번역

## 프로젝트 구조

```
claude-teaches-code/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── orchestrator.ts    # 적절한 에이전트로 요청 라우팅
│   │   │   ├── codeGen.ts         # 언어 감지와 함께 코드 생성
│   │   │   └── explain.ts         # 코드 설명 및 라인 분석
│   │   ├── routes/
│   │   │   ├── generate.ts        # 코드 생성 엔드포인트
│   │   │   ├── explain.ts         # 설명 엔드포인트
│   │   │   ├── playground.ts      # 코드 실행 엔드포인트
│   │   │   └── notion.ts          # Notion 통합
│   │   ├── locales/
│   │   │   ├── en.json           # 에이전트용 영어 프롬프트
│   │   │   └── ko.json           # 에이전트용 한국어 프롬프트
│   │   ├── types/index.ts        # TypeScript 인터페이스
│   │   └── index.ts              # Express 서버 설정
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodeEditor.tsx         # 라인 클릭이 있는 Monaco 에디터
│   │   │   ├── ExplanationPanel.tsx   # 마크다운 설명 표시
│   │   │   ├── CodePlayground.tsx     # 코드 실행 UI
│   │   │   ├── ThinkingProcess.tsx    # Extended thinking 표시
│   │   │   ├── WorkflowVisualizer.tsx # 에이전트 워크플로우 표시
│   │   │   └── NotionSaveButton.tsx   # Notion 통합 UI
│   │   ├── i18n/
│   │   │   ├── config.ts         # i18next 설정
│   │   │   ├── en.json          # 영어 번역
│   │   │   └── ko.json          # 한국어 번역
│   │   ├── services/
│   │   │   └── api.ts           # API 클라이언트 함수
│   │   ├── types/index.ts       # TypeScript 인터페이스
│   │   ├── App.tsx              # 메인 애플리케이션
│   │   └── main.tsx             # 진입점
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## 상세 구현 지침

### 1단계: 백엔드 설정

1. **백엔드 초기화**:
```bash
mkdir claude-teaches-code && cd claude-teaches-code
mkdir backend && cd backend
npm init -y
npm install express cors dotenv @anthropic-ai/sdk
npm install -D typescript tsx @types/node @types/express @types/cors
npx tsc --init
```

2. **에이전트 시스템 생성**:

**Orchestrator 에이전트** (`src/agents/orchestrator.ts`):
- 사용자 요청 분석
- CodeGen 또는 Explain 에이전트로 라우팅
- 워크플로우 단계 반환

**CodeGen 에이전트** (`src/agents/codeGen.ts`):
- Extended Thinking으로 코드 생성
- 코드 블록에서 프로그래밍 언어 감지
- 언어 태그가 없으면 내용에서 자동 감지 (function/const/let = JavaScript, def/import = Python)
- 반환: thinking, code, keyDecisions, nextSteps, language

**Explain 에이전트** (`src/agents/explain.ts`):
- 상세한 코드 설명 제공
- 라인별 설명 처리 (속도를 위해 Extended Thinking 없음)
- 반환: explanation, thinking (선택사항)

3. **라우트 생성**:

**Generate 라우트** (`src/routes/generate.ts`):
- POST `/api/generate` - 코드 생성 스트림
- 실시간 업데이트를 위한 Server-Sent Events 사용
- orchestrator 워크플로우 + 코드 + 설명 반환

**Explain 라우트** (`src/routes/explain.ts`):
- POST `/api/explain-line` - 특정 코드 라인 설명
- Extended Thinking 없이 빠른 응답

**Playground 라우트** (`src/routes/playground.ts`):
- POST `/api/playground/execute` - JavaScript 코드 실행
- 콘솔 캡처와 함께 샌드박스 실행
- 사용자 정의 console.time/timeEnd 구현

4. **환경 변수** (`.env`):
```
ANTHROPIC_API_KEY=your_api_key
EXTENDED_THINKING_BUDGET=10000
PORT=3001
```

### 2단계: 프론트엔드 설정

1. **프론트엔드 초기화**:
```bash
cd .. && mkdir frontend && cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install @monaco-editor/react lucide-react react-markdown remark-gfm
npm install react-i18next i18next
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Vite 설정** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

3. **Tailwind 설정** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
```

4. **i18n 설정** (`src/i18n/config.ts`):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ko from './ko.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: 'en',
  fallbackLng: 'en',
});
```

### 3단계: 핵심 컴포넌트

**App.tsx** - 메인 애플리케이션 레이아웃:
- 제목, 언어 전환 (🌐), 테마 전환 (🌙/☀️)이 있는 헤더
- 코드 생성 요청용 입력 텍스트 영역
- 워크플로우 시각화 도구
- 사고 과정 표시 (접을 수 있음)
- 2열 레이아웃:
  - 왼쪽: 코드 에디터 (450px) + 주요 결정사항/다음 단계 (226px)
  - 오른쪽: 설명 패널 (700px)
- 하단 1:1 레이아웃: 코드 실행 + Notion 저장

**CodeEditor.tsx** - Monaco Editor 통합:
- 생성된 코드 표시
- 라인 번호를 클릭하여 설명
- 복사 및 다운로드 버튼
- 구문 강조
- 다크/라이트 테마 지원

**ExplanationPanel.tsx** - 마크다운 설명 표시:
- 마크다운 렌더링이 있는 메인 설명
- 핵심 개념 섹션 (선택사항)
- 흔한 실수 섹션 (선택사항)
- Extended Thinking 섹션 (선택사항)
- 고정 700px 높이로 스크롤 가능

**CodePlayground.tsx** - 코드 실행:
- 샌드박스 Function에서 JavaScript 실행
- Pyodide로 Python 실행
- 출력 및 실행 시간 표시
- 포맷된 표시로 에러 처리

**NotionSaveButton.tsx** - Notion 통합:
- 로딩 상태가 있는 저장 버튼
- `/api/notion/save`로 POST
- 성공/에러 알림

### 4단계: 주요 구현 세부사항

**언어 감지** (백엔드):
```typescript
// 1. 코드 블록에서 추출 시도: ```javascript
const langMatch = code.match(/```(\w+)/);
let detectedLanguage = langMatch ? langMatch[1].toLowerCase() : 'text';

// 2. 일반적인 변형 정규화
if (detectedLanguage === 'js') detectedLanguage = 'javascript';
if (detectedLanguage === 'py') detectedLanguage = 'python';

// 3. 여전히 'text'이면 내용에서 자동 감지
if (detectedLanguage === 'text') {
  if (code.includes('function') || code.includes('const') || code.includes('let')) {
    detectedLanguage = 'javascript';
  } else if (code.includes('def ') || code.includes('import ')) {
    detectedLanguage = 'python';
  }
}
```

**코드 실행 샌드박스** (백엔드):
```typescript
const sandbox = {
  console: {
    log: (...args) => output.push(args.join(' ')),
    time: (label) => timeLabels.set(label, Date.now()),
    timeEnd: (label) => {
      const duration = Date.now() - timeLabels.get(label);
      output.push(`${label}: ${duration}ms`);
    },
  },
  Math, JSON, Array, Object, String, Number, Boolean, Date,
};

const fn = new Function(...Object.keys(sandbox), code);
fn(...Object.values(sandbox));
```

**라인 설명** (프론트엔드):
```typescript
const handleLineClick = async (lineNumber: number) => {
  const result = await explainLine(
    generatedCode.code,
    lineNumber,
    language,
    generatedCode.language
  );

  setLineExplanations(prev => [
    ...prev.filter(e => e.lineNumber !== lineNumber),
    { lineNumber, explanation: result.explanation }
  ]);
};
```

### 5단계: 스타일링 가이드라인

**색상 구성**:
- 주요: Blue-600에서 Purple-600 그라데이션
- 성공: Green-600
- 에러: Red-600
- 경고: Amber-600
- 정보: Blue-600

**레이아웃 높이**:
- 코드 에디터: 450px (고정)
- 주요 결정사항 박스: 226px (고정)
- 설명 패널: 700px (고정)
- 전체 왼쪽 열: 450px + 24px gap + 226px = 700px

**반응형 디자인**:
- 데스크톱 (lg): 2열 그리드 레이아웃
- 모바일: 단일 열 스택

**다크 모드**:
- state + document.documentElement.classList를 통한 전환
- Monaco 에디터 테마: 'vs-dark' 또는 'light'

### 6단계: API 통합

**코드 생성** (스트리밍):
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, language }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // workflow, thinking, code, explanation 처리
    }
  }
}
```

**코드 실행**:
```typescript
const response = await fetch('/api/playground/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});

const { success, data } = await response.json();
// data 포함: success, output, executionTime, 또는 error
```

## 환경 설정

**백엔드** (`.env`):
```
ANTHROPIC_API_KEY=sk-ant-...
EXTENDED_THINKING_BUDGET=10000
PORT=3001
NOTION_API_KEY=secret_... (선택사항)
NOTION_DATABASE_ID=... (선택사항)
```

**프론트엔드** (`.env`):
```
VITE_API_URL=http://localhost:3001
```

## 프로젝트 실행

**개발 모드**:
```bash
# 터미널 1 - 백엔드
cd backend
npm run dev

# 터미널 2 - 프론트엔드
cd frontend
npm run dev
```

**프로덕션 빌드**:
```bash
# 프론트엔드
cd frontend
npm run build

# 백엔드
cd backend
npm run build
```

## 테스트 예시

**코드 생성 요청**:
```
처음 n개의 숫자를 배열로 반환하는 피보나치 수열 생성기를 JavaScript로 만들어주세요.
```

**예상 워크플로우**:
1. Orchestrator가 요청 분석
2. CodeGen 에이전트로 라우팅
3. Extended Thinking이 문제 분석
4. 최적화된 JavaScript 코드 생성
5. Explain 에이전트가 상세한 설명 제공
6. Monaco 에디터에 코드 표시
7. 라인 번호를 클릭하여 라인별 설명 확인
8. "실행"을 클릭하여 코드 실행
9. "Notion에 저장"을 클릭하여 결과 저장

## 주요 고려사항

1. **에러 처리**: 모든 API 호출에 try-catch 블록 필요
2. **로딩 상태**: 비동기 작업 중 로딩 인디케이터 표시
3. **유효성 검사**: API 호출 전 사용자 입력 유효성 검사
4. **보안**: 악성 코드를 방지하기 위한 샌드박스 코드 실행
5. **성능**: 비용이 많이 드는 컴포넌트에 React.memo 사용
6. **접근성**: 적절한 ARIA 레이블 및 키보드 탐색
7. **반응형**: 모바일 우선 디자인 접근
8. **i18n**: 모든 사용자 대면 텍스트는 번역 키 사용 필수

## 향후 개선사항 (선택사항)

- [ ] 코드 비교 기능
- [ ] 성능 측정
- [ ] 대안 구현
- [ ] 다양한 형식으로 내보내기
- [ ] URL을 통한 코드 공유
- [ ] 구문 강조 테마
- [ ] 더 많은 언어 지원 (TypeScript, Python, Go 등)
- [ ] AI 기반 코드 리뷰
- [ ] 대화형 튜토리얼
- [ ] 코드 플레이그라운드 공유

---

**이 프로젝트를 단계별로 구축하고, 다음 단계로 넘어가기 전에 각 컴포넌트가 작동하는지 확인하세요. 각 단계에서 철저히 테스트하세요.**
