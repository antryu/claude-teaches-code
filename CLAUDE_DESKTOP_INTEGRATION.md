# Claude Desktop MCP 서버 연동 가이드

## 개요

이 가이드는 claude-teaches-code의 MCP 서버를 Claude Desktop 앱과 연동하는 방법을 설명합니다.

## 사전 요구사항

- Node.js 18+ 설치
- Claude Desktop 앱 설치
- `@modelcontextprotocol/sdk` 패키지

## 1. MCP 서버 실행 준비

### 의존성 설치

```bash
cd /Users/andrew/Thairon/Claude_Edu/claude-teaches-code
npm install @modelcontextprotocol/sdk
```

### 실행 권한 부여

```bash
chmod +x mcp-server.js
```

### 독립 실행 테스트

```bash
node mcp-server.js
```

정상 작동 시 출력:
```
Claude Code Playground MCP Server running
```

## 2. Claude Desktop 설정

### macOS 설정 파일 위치

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### 설정 파일 생성/수정

```json
{
  "mcpServers": {
    "claude-code-playground": {
      "command": "node",
      "args": [
        "/Users/andrew/Thairon/Claude_Edu/claude-teaches-code/mcp-server.js"
      ],
      "env": {}
    }
  }
}
```

**중요**: 절대 경로를 사용해야 합니다!

## 3. Claude Desktop 재시작

설정 파일을 저장한 후 Claude Desktop을 완전히 종료하고 다시 시작합니다.

## 4. 연동 확인

Claude Desktop 채팅창에서 다음과 같이 테스트:

```
다음 코드를 실행해줘:
console.log("Hello from MCP!");
console.log(2 + 2);
```

Claude가 `execute_javascript` 도구를 사용하여 코드를 실행하고 결과를 보여줍니다.

## 5. 사용 가능한 도구

### 1. execute_javascript

JavaScript 코드를 안전한 샌드박스에서 실행합니다.

**예시:**
```
이 코드를 실행해줘:
const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
```

### 2. compare_code_performance

여러 구현의 성능을 비교합니다.

**예시:**
```
다음 두 방법의 성능을 비교해줘:
1. for 루프로 배열 합계
2. reduce로 배열 합계
```

### 3. explain_js_error

JavaScript 에러를 분석하고 설명합니다.

**예시:**
```
이 에러를 설명해줘:
TypeError: Cannot read property 'name' of undefined
```

## 6. 문제 해결

### MCP 서버가 연결되지 않을 때

1. **로그 확인**
   ```bash
   # macOS
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

2. **경로 확인**
   - `claude_desktop_config.json`의 절대 경로가 정확한지 확인
   - `mcp-server.js` 파일이 실제로 존재하는지 확인

3. **Node.js 버전 확인**
   ```bash
   node --version  # v18 이상이어야 함
   ```

4. **수동 실행 테스트**
   ```bash
   node /Users/andrew/Thairon/Claude_Edu/claude-teaches-code/mcp-server.js
   ```

### 도구가 표시되지 않을 때

1. Claude Desktop 완전히 재시작
2. 설정 파일 JSON 문법 오류 확인
3. 서버 로그에서 오류 메시지 확인

## 7. 고급 설정

### 환경 변수 추가

```json
{
  "mcpServers": {
    "claude-code-playground": {
      "command": "node",
      "args": ["/절대/경로/mcp-server.js"],
      "env": {
        "DEBUG": "true",
        "MAX_TIMEOUT": "5000"
      }
    }
  }
}
```

### 여러 MCP 서버 추가

```json
{
  "mcpServers": {
    "claude-code-playground": {
      "command": "node",
      "args": ["/경로/mcp-server.js"]
    },
    "another-mcp-server": {
      "command": "python",
      "args": ["/경로/another_server.py"]
    }
  }
}
```

## 8. 보안 고려사항

- MCP 서버는 샌드박스 환경에서 코드를 실행합니다
- 파일 시스템 접근, 네트워크 요청 등은 제한됩니다
- 민감한 정보를 포함한 코드는 실행하지 마세요

## 9. 성능 최적화

- 서버는 세션당 한 번만 시작됩니다
- 코드 실행 결과는 캐시되지 않습니다
- 무거운 연산은 타임아웃(기본 5초)될 수 있습니다

## 10. 추가 리소스

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [Claude Desktop 설정 가이드](https://docs.anthropic.com/claude/docs)
- [프로젝트 README](./README.md)
