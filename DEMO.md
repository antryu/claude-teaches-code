# Claude Teaches Code - Demo Guide

## Quick Demo Scenarios

### 1. Generate a React Component (English)

**Step 1:** Enter this prompt:
```
Create a responsive Card component in React with TypeScript that displays a title, description, image, and action button. Include props validation and accessibility features.
```

**Expected Workflow:**
1. ✅ Orchestrator analyzes intent → "generate"
2. ✅ CodeGenAgent activates
3. ✅ Displays:
   - Animated workflow visualization
   - Thinking process in collapsible panel
   - Generated code with syntax highlighting
   - Key decisions explained
   - Suggested next steps

**Step 2:** Click the "?" icon next to any line in the code

**Expected Result:**
- Line-specific explanation appears
- Extended Thinking shows deep analysis
- Key concepts highlighted
- Common mistakes listed

---

### 2. 코드 생성하기 (한국어)

**1단계:** 이 프롬프트 입력:
```
로그인 폼을 React와 TypeScript로 만들어주세요. 이메일과 비밀번호 입력 필드, 검증 기능, 그리고 에러 메시지 표시 기능을 포함해주세요.
```

**예상 워크플로우:**
1. ✅ 조율자가 의도 분석 → "생성"
2. ✅ 코드생성기 활성화
3. ✅ 표시 내용:
   - 애니메이션 워크플로우 시각화
   - 접을 수 있는 패널의 사고 과정
   - 구문 강조된 생성 코드
   - 주요 결정 사항 설명
   - 제안된 다음 단계

**2단계:** 코드의 어떤 줄 옆 "?" 아이콘 클릭

**예상 결과:**
- 줄별 설명 표시
- Extended Thinking의 깊이 있는 분석
- 핵심 개념 강조
- 일반적인 실수 나열

---

### 3. Explain Complex Concepts

**Step 1:** Enter this prompt:
```
Explain how the JavaScript event loop works with async/await, including the microtask queue and macrotask queue
```

**Expected Workflow:**
1. ✅ Orchestrator analyzes intent → "explain"
2. ✅ ExplainAgent activates with Extended Thinking
3. ✅ Displays:
   - Deep explanation with real-world analogies
   - Extended Thinking process (10K tokens)
   - Key concepts breakdown
   - Common mistakes to avoid

---

### 4. Get Alternative Implementations

**Step 1:** Generate this code:
```
Create a debounce function in JavaScript
```

**Step 2:** Click "Show Alternatives" button

**Expected Result:**
- Multiple implementation approaches
- Pros and cons for each approach
- Performance considerations
- Use case recommendations

---

### 5. Interactive Learning Flow

**Complete Learning Session:**

1. **Generate** (English):
   ```
   Create a custom React hook for fetching data with loading and error states
   ```

2. **Explore Code:**
   - Click "?" on `useState` line → Learn about state management
   - Click "?" on `useEffect` line → Understand side effects
   - Click "?" on `try/catch` → Learn error handling

3. **Get Alternatives:**
   - Click "Show Alternatives"
   - Compare different approaches (SWR, React Query, custom)

4. **Switch Language:**
   - Click 🌐 icon to toggle Korean
   - All UI elements update
   - Continue learning in Korean

---

### 6. 대화형 학습 플로우 (한국어)

**완전한 학습 세션:**

1. **생성**:
   ```
   로딩 및 에러 상태를 포함한 데이터 페칭용 커스텀 React 훅 만들기
   ```

2. **코드 탐색:**
   - `useState` 줄의 "?" 클릭 → 상태 관리 학습
   - `useEffect` 줄의 "?" 클릭 → 부수 효과 이해
   - `try/catch` 줄의 "?" 클릭 → 에러 처리 학습

3. **대안 확인:**
   - "대안 보기" 클릭
   - 다양한 접근 방식 비교 (SWR, React Query, 커스텀)

4. **언어 전환:**
   - 🌐 아이콘 클릭하여 영어로 전환
   - 모든 UI 요소 업데이트
   - 영어로 학습 계속

---

## Advanced Features Demo

### Extended Thinking Deep Dive

**Prompt:**
```
Explain the differences between var, let, and const in JavaScript, including hoisting, scope, and temporal dead zone
```

**What to Observe:**
1. **Extended Thinking Panel** (purple section):
   - Click to expand
   - See 10K token deep analysis
   - Observe systematic breakdown of concepts

2. **Educational Structure:**
   - Thinking process explained step-by-step
   - Main explanation with analogies
   - Key concepts highlighted
   - Common pitfalls identified

### Workflow Visualization

**Any generation request triggers:**

1. **Animated Icons:**
   - 🤖 Orchestrator (blue pulse when active)
   - 💻 CodeGenAgent (green when complete)
   - 💬 ExplainAgent (animated dots during processing)

2. **Progress Line:**
   - Shows current step
   - Completed steps marked with ✅
   - Active step pulses

3. **Reasoning Display:**
   - Why this workflow was chosen
   - Which agents are activated
   - Expected outputs

### Theme & Language Controls

**Top-right controls:**

1. **🌐 Language Toggle:**
   - EN ⟷ KO seamless switch
   - All text updates immediately
   - AI responses in selected language

2. **🌙/☀️ Theme Toggle:**
   - Dark mode (default)
   - Light mode
   - Persists across sessions
   - Affects code editor theme

### Real-time Streaming

**Observe during generation:**

1. **SSE Stream:**
   - Code appears character-by-character
   - Thinking process streams live
   - Workflow updates in real-time

2. **Loading States:**
   - Animated workflow indicators
   - "Analyzing..." states
   - Smooth transitions

---

## Testing the System

### Backend Health Check

```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "model": "claude-sonnet-4-5-20250929",
  "extendedThinking": {
    "enabled": true,
    "budget": 10000
  }
}
```

### API Testing with curl

**Generate Code:**
```bash
curl -N -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a Hello World function",
    "language": "en"
  }'
```

**Explain Line:**
```bash
curl -X POST http://localhost:3001/api/explain-line \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x = 5;",
    "lineNumber": 1,
    "language": "en",
    "programmingLanguage": "javascript"
  }'
```

---

## Common Demo Prompts

### For Code Generation:

**English:**
- "Create a responsive navbar in React with mobile menu"
- "Build a pagination component with TypeScript"
- "Make a custom tooltip component with accessibility"
- "Create a form with validation using React Hook Form"

**한국어:**
- "모바일 메뉴가 있는 반응형 네비게이션 바를 React로 만들기"
- "TypeScript로 페이지네이션 컴포넌트 만들기"
- "접근성을 고려한 커스텀 툴팁 컴포넌트 만들기"
- "React Hook Form을 사용한 검증 폼 만들기"

### For Explanations:

**English:**
- "Explain closures in JavaScript with examples"
- "How does React's useEffect cleanup work?"
- "What is the difference between null and undefined?"
- "Explain promises vs async/await"

**한국어:**
- "JavaScript의 클로저를 예제와 함께 설명"
- "React의 useEffect 정리 함수는 어떻게 작동하나요?"
- "null과 undefined의 차이는 무엇인가요?"
- "프로미스와 async/await의 차이 설명"

---

## Troubleshooting Demo

### If streaming doesn't work:

1. Check browser console for errors
2. Verify backend is running: `http://localhost:3001/api/health`
3. Check ANTHROPIC_API_KEY in backend/.env
4. Ensure no proxy/firewall blocking SSE

### If explanations are empty:

1. Verify Extended Thinking is enabled (budget > 0)
2. Check backend logs for API errors
3. Ensure sufficient API credits

### If UI is not responsive:

1. Clear browser cache
2. Check console for React errors
3. Verify all npm packages installed
4. Try different browser

---

## Success Indicators

✅ **Workflow Visualization** shows animated steps
✅ **Thinking Process** expands with content
✅ **Code Editor** displays syntax-highlighted code
✅ **Line Explanations** appear when clicking "?"
✅ **Language Toggle** switches all text instantly
✅ **Theme Toggle** changes colors smoothly
✅ **Extended Thinking** shows deep analysis (10K tokens)
✅ **Streaming** updates in real-time

---

**Enjoy exploring AI-powered code education! 🎓**
