# NavFlag Plugin 테스트 가이드

## 개요

이 프로젝트는 Stackflow의 navigation flag 패턴을 검증하는 유닛 테스트를 제공합니다. 시나리오 JSON 데이터를 기반으로 각 flag의 동작이 올바른지 자동으로 검증합니다.

## 테스트 구조

### 1. NavFlag Plugin 단위 테스트 (`navFlagPlugin.test.ts`)

각 flag 패턴의 핵심 로직을 테스트합니다:

- **PUSH (기본 동작)**: 일반적인 스택 push 동작
- **SINGLE_TOP**: 최상단이 동일하면 replace, 아니면 push
- **CLEAR_TOP**: 대상이 스택에 있으면 그 위를 제거하고 replace
- **CLEAR_STACK**: 스택을 모두 비우고 새로운 액티비티로 시작
- **JUMP_TO**: targetActivityId와 무관하게 지정된 activity로 이동
- **CLEAR_TOP_SINGLE_TOP**: CLEAR_TOP 실패 시 SINGLE_TOP으로 동작
- **JUMP_TO_CLEAR_TOP**: 대상이 스택에 있으면 되감기, 없으면 push

### 2. 시나리오 플로우 테스트 (`scenarioFlow.test.ts`)

`defaultScenarios.json`에 정의된 시나리오들의 실제 플로우를 검증합니다:

- **시나리오 1**: stack-basic-flow - A → B → C 후 CLEAR_TOP으로 B 복귀
- **시나리오 2**: jump-to-flow - JUMP_TO 동작 검증
- **시나리오 3**: clear-top-single-top-flow - CLEAR_TOP_SINGLE_TOP 조합 검증
- **시나리오 4**: jump-to-clear-top-flow - JUMP_TO_CLEAR_TOP 동작 검증

## 테스트 실행 방법

### 전체 테스트 실행

```bash
npm test
```

### 단일 실행 모드 (CI용)

```bash
npm run test:run
```

### 특정 테스트 파일만 실행

```bash
npm test -- navFlagPlugin.test.ts
npm test -- scenarioFlow.test.ts
```

### Watch 모드

```bash
npm test
# 또는
npx vitest
```

### UI 모드 (브라우저에서 테스트 결과 확인)

```bash
npm run test:ui
```

## 테스트 추가 방법

### 1. 새로운 Flag 패턴 추가

`navFlagPlugin.test.ts`에 새로운 describe 블록을 추가:

```typescript
describe("NEW_FLAG", () => {
  it("새로운 동작을 검증한다", () => {
    simulatePush("activity-a");
    simulatePush(
      "activity-b",
      {},
      { flag: "NEW_FLAG", activity: "activity-a" }
    );

    expect(mockActions.getStackDepth()).toBe(/* 예상값 */);
    expect(mockActions.getStackNames()).toEqual([
      /* 예상 스택 */
    ]);
  });
});
```

### 2. 새로운 시나리오 추가

1. `defaultScenarios.json`에 시나리오 정의 추가
2. `scenarioFlow.test.ts`에 테스트 케이스 추가:

```typescript
describe("시나리오 N: 새로운-시나리오", () => {
  const scenario = scenarioDefinitions.find((s) => s.id === "새로운-시나리오");

  it("시나리오가 정의되어 있다", () => {
    expect(scenario).toBeDefined();
  });

  it("특정 플로우를 검증한다", () => {
    // 테스트 로직
  });
});
```

## MockStackActions API

테스트에서 사용되는 Mock 스택 액션:

```typescript
// 스택 상태 조회
mockActions.getStack(): MockStackState
mockActions.getStackNames(): string[]
mockActions.getStackDepth(): number
mockActions.getCurrentActivity(): MockActivity | undefined

// 스택 조작
mockActions.push(options): void
mockActions.pop(): void
mockActions.replace(options): void

// 테스트 헬퍼
mockActions.reset(): void
```

## 주요 테스트 패턴

### 스택 상태 검증

```typescript
expect(mockActions.getStackDepth()).toBe(2);
expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
```

### 현재 액티비티 검증

```typescript
expect(mockActions.getCurrentActivity()?.name).toBe("activity-b");
expect(mockActions.getCurrentActivity()?.context?.navFlag).toEqual({
  flag: "SINGLE_TOP",
});
```

### 시나리오 데이터 검증

```typescript
const scenario = scenarioDefinitions.find((s) => s.id === "scenario-id");
expect(scenario).toBeDefined();
expect(scenario?.activities).toHaveLength(3);
```

## CI/CD 통합

```yaml
# GitHub Actions 예시
- name: Run Tests
  run: npm run test:run
```

## 커버리지 확인

```bash
npm test -- --coverage
```

## 문제 해결

### 테스트 실패 시

1. 스택 상태를 확인: `console.log(mockActions.getStackNames())`
2. navFlag 파라미터 확인: full activity name (scenarioId::activityId) 사용 여부
3. JSON 시나리오 정의 확인: 요소가 올바르게 정의되어 있는지

### 타입 에러 발생 시

- `tsconfig.json`에 vitest types 추가:
  ```json
  {
    "compilerOptions": {
      "types": ["vitest/globals"]
    }
  }
  ```

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Stackflow 공식 문서](https://stackflow.so/)
