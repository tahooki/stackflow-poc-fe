# Stackflow POC - Navigation Flag Pattern

Stackflow 라이브러리의 Android Intent Flag 패턴을 검증하는 POC 프로젝트입니다.

## 프로젝트 개요

이 프로젝트는 Stackflow의 다양한 navigation flag 패턴을 테스트하고, 시나리오 기반으로 스택 네비게이션이 올바르게 동작하는지 검증합니다.

## 주요 기능

### Navigation Flag 패턴

- **PUSH**: 기본 스택 push 동작
- **SINGLE_TOP**: 최상단이 동일하면 재진입, 다르면 push
- **CLEAR_TOP**: 스택에서 대상을 찾아 그 위의 모든 액티비티 제거
- **CLEAR_STACK**: 전체 스택 초기화
- **JUMP_TO**: targetActivityId와 무관하게 지정된 액티비티로 이동
- **CLEAR_TOP_SINGLE_TOP**: CLEAR_TOP 실패 시 SINGLE_TOP으로 동작
- **JUMP_TO_CLEAR_TOP**: 스택에 있으면 되감기, 없으면 push

### 시나리오 기반 테스트

JSON 파일로 정의된 시나리오를 기반으로 자동화된 테스트를 실행합니다:

- 시나리오 1: 스택 기본 흐름 (A → B → C, CLEAR_TOP)
- 시나리오 2: JUMP_TO 이동
- 시나리오 3: CLEAR_TOP_SINGLE_TOP 조합
- 시나리오 4: JUMP_TO_CLEAR_TOP 이동

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 테스트 실행

```bash
# Watch 모드로 테스트 실행
npm test

# 단일 실행 (CI용)
npm run test:run

# UI 모드로 테스트 결과 확인
npm run test:ui
```

### 빌드

```bash
npm run build
```

## 테스트 구조

### 유닛 테스트

- `src/plugins/navFlagPlugin.test.ts`: 각 flag 패턴의 핵심 로직 테스트
- `src/scenarios/scenarioFlow.test.ts`: JSON 시나리오 기반 플로우 테스트

### Mock 시스템

- `src/test-utils/mockStackActions.ts`: Stackflow 스택 동작 시뮬레이션
- `src/test-utils/setup.ts`: Vitest 설정

### 테스트 결과

```
✓ NavFlag Plugin Tests (15 tests)
✓ Scenario Flow Tests (17 tests)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 32 tests passed
```

## 시나리오 추가 방법

1. `src/scenarios/defaultScenarios.json`에 시나리오 정의 추가
2. `src/scenarios/scenarioFlow.test.ts`에 테스트 케이스 작성
3. `npm test`로 검증

자세한 내용은 [테스트 가이드](./src/plugins/README.test.md)를 참고하세요.

## 기술 스택

- **React 19** + **TypeScript**
- **Vite**: 빌드 도구
- **Stackflow**: 스택 기반 네비게이션
- **Vitest**: 테스트 프레임워크
- **React Testing Library**: React 컴포넌트 테스트

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
