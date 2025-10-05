# ⚡ 빠른 시작: 5분 안에 시작하기 (한글)

Claude Teaches Code + Notion 통합을 빠르게 시작하는 가이드입니다.

## 🚀 1분: 서버 실행

```bash
# 백엔드 실행
cd claude-teaches-code/backend
npm run dev

# 새 터미널에서 프론트엔드 실행
cd claude-teaches-code/frontend
npm run dev
```

브라우저: `http://localhost:3000` 접속

## 🔑 2분: Notion 설정

### 1. Integration Token 받기
1. https://www.notion.so/my-integrations
2. "+ New integration" → 이름 입력 → Submit
3. Token 복사: `secret_xxxxx...`

### 2. Database 준비
1. Notion에서 새 페이지 생성
2. `/database` 입력 → "Table" 선택
3. "⋯" → "연결 추가" → Integration 선택
4. URL에서 ID 복사: `notion.so/workspace/THIS_PART?v=...`

## 💻 2분: 첫 코드 생성 및 저장

### 1. 코드 생성
**프롬프트 입력**:
```
문자열이 회문인지 확인하는 JavaScript 함수 작성해줘
```

**"Generate Code" 클릭** ✨

### 2. Notion 연결 (최초 1회)
1. 하단 "Notion 저장" 박스 → ⚙️ 아이콘
2. Token과 Database ID 입력
3. "연결하기" 클릭

### 3. 저장
1. 태그 입력: `문자열, 알고리즘, JavaScript`
2. "Notion에 저장" 클릭
3. Notion 페이지 자동 오픈! 🎉

## 🎯 선택사항: 코드 실행 & 성능 측정

**코드 실행**:
- "코드 실행" 박스 → "실행" 클릭

**성능 측정**:
- "성능 측정" 박스 → 반복 횟수 선택 → "측정 시작"

**결과가 자동으로 Notion에 포함됩니다!**

---

## ✅ 완료!

이제 모든 학습 내용이 Notion에 자동으로 정리됩니다! 📚

더 자세한 내용은 [NOTION_USAGE_GUIDE_KR.md](./NOTION_USAGE_GUIDE_KR.md)를 확인하세요.
