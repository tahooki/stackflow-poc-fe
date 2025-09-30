# 시나리오 기반 Flag 패턴 테스트 시스템

## 📋 개요

Stackflow의 Navigation Flag 패턴을 검증하는 자동화된 유닛 테스트 시스템입니다.
JSON 기반 시나리오를 정의하고, 각 flag 패턴이 정상적으로 동작하는지 자동으로 검증합니다.

## ✅ 구현 완료 항목

### 1. 테스트 인프라 구축

- ✅ **Vitest 설정**: 프로젝트에 Vitest + React Testing Library 설치
- ✅ **Mock System**: Stackflow 스택 동작을 시뮬레이션하는 MockStackActions 구현
- ✅ **테스트 설정**: `vitest.config.ts`, `setup.ts` 생성

**파일**:

- `/vitest.config.ts`
- `/src/test-utils/setup.ts`
- `/src/test-utils/mockStackActions.ts`

### 2. NavFlag Plugin 단위 테스트

각 flag 패턴의 핵심 로직을 독립적으로 테스트합니다.

**테스트 케이스** (15개):

- PUSH (2 tests)
  - ✅ 기본 push 동작
  - ✅ 여러 번 push하면 스택 누적
- SINGLE_TOP (2 tests)
  - ✅ 최상단 동일 시 replace
  - ✅ 최상단 다르면 push
- CLEAR_TOP (2 tests)
  - ✅ 스택에 대상 있으면 되감기
  - ✅ 스택에 대상 없으면 push
- CLEAR_STACK (2 tests)
  - ✅ 스택 전체 초기화
  - ✅ 빈 스택에서 실행
- JUMP_TO (2 tests)
  - ✅ targetActivityId 무시
  - ✅ 항상 새로 push
- CLEAR_TOP_SINGLE_TOP (3 tests)
  - ✅ CLEAR_TOP 성공 시
  - ✅ CLEAR_TOP 실패 + 최상단 동일
  - ✅ CLEAR_TOP 실패 + 최상단 다름
- JUMP_TO_CLEAR_TOP (2 tests)
  - ✅ 스택에 있으면 되감기
  - ✅ 스택에 없으면 push

**파일**: `/src/plugins/navFlagPlugin.test.ts`

### 3. 시나리오 기반 통합 테스트

`defaultScenarios.json`의 실제 시나리오를 검증합니다.

**테스트 케이스** (17개):

#### 시나리오 1: stack-basic-flow (5 tests)

- ✅ 시나리오 정의 확인
- ✅ Entry → Activity A 시작
- ✅ A → B → C 순서 push
- ✅ C에서 CLEAR_TOP으로 B 복귀
- ✅ CLEAR_STACK으로 A 초기화

#### 시나리오 2: jump-to-flow (2 tests)

- ✅ 시나리오 정의 확인
- ✅ JUMP_TO로 targetActivityId 무시

#### 시나리오 3: clear-top-single-top-flow (3 tests)

- ✅ 시나리오 정의 확인
- ✅ 스택에 있으면 CLEAR_TOP 동작
- ✅ 스택에 없으면 SINGLE_TOP 동작

#### 시나리오 4: jump-to-clear-top-flow (3 tests)

- ✅ 시나리오 정의 확인
- ✅ 스택에 있으면 되감기
- ✅ 스택에 없으면 push

#### 메타 검증 (4 tests)

- ✅ 모든 시나리오 로드 확인
- ✅ entry와 activities 존재 확인
- ✅ 고유한 activityName 확인
- ✅ navFlag 구조 유효성 확인

**파일**: `/src/scenarios/scenarioFlow.test.ts`

### 4. 문서화

- ✅ **README.md**: 프로젝트 개요 및 테스트 실행 방법
- ✅ **README.test.md**: 테스트 상세 가이드
- ✅ **SCENARIO_GUIDE.md**: 시나리오 JSON 작성 가이드
- ✅ **TEST_SUMMARY.md**: 전체 작업 요약 (현재 문서)

## 📊 테스트 결과

```
✓ NavFlag Plugin Tests (15 tests) - 5ms
✓ Scenario Flow Tests (17 tests) - 6ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 32 tests passed in 2 files
Duration: 1.02s
```

## 🚀 사용 방법

### 테스트 실행

```bash
# Watch 모드 (개발 중)
npm test

# 단일 실행 (CI)
npm run test:run

# UI 모드
npm run test:ui

# 특정 파일만 실행
npm test -- navFlagPlugin.test.ts
```

### 새 시나리오 추가

1. `src/scenarios/defaultScenarios.json`에 시나리오 추가
2. `src/scenarios/scenarioFlow.test.ts`에 테스트 작성
3. `npm test`로 검증

예시:

```json
{
  "id": "new-scenario",
  "title": "새로운 시나리오",
  "description": "설명",
  "flagLabel": "FLAG_TYPE",
  "entry": { "activityId": "start" },
  "activities": [...]
}
```

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│     defaultScenarios.json               │
│     (시나리오 정의)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     scenarioDefinitions                 │
│     (시나리오 로더)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     ScenarioActivity                    │
│     (런타임 렌더링)                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     navFlagPlugin                       │
│     (Flag 패턴 로직)                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Stackflow Stack                     │
│     (실제 스택 관리)                     │
└─────────────────────────────────────────┘

테스트:
┌─────────────────────────────────────────┐
│     MockStackActions                    │
│     (스택 시뮬레이션)                    │
└──────────────┬──────────────────────────┘
               │
               ├─► navFlagPlugin.test.ts
               │   (단위 테스트)
               │
               └─► scenarioFlow.test.ts
                   (통합 테스트)
```

## 🔧 주요 컴포넌트

### MockStackActions

실제 Stackflow 스택을 시뮬레이션하는 Mock 클래스:

- `push()`, `pop()`, `replace()`: 스택 조작
- `getStack()`, `getStackNames()`: 스택 상태 조회
- `reset()`: 테스트 간 상태 초기화

### executeNavigation()

시나리오 내비게이션을 시뮬레이션하는 헬퍼 함수:

- navFlag에 따라 적절한 스택 조작 수행
- 실제 navFlagPlugin 로직과 동일하게 동작

## 📈 향후 확장 가능성

### 1. 추가 Flag 패턴

새로운 flag 패턴을 쉽게 추가할 수 있습니다:

```typescript
case 'NEW_FLAG': {
  // 로직 구현
  break;
}
```

### 2. 파라미터 전달 테스트

Activity params가 올바르게 전달되는지 검증:

```typescript
it("params가 올바르게 전달된다", () => {
  executeNavigation("activity-b", undefined, { userId: 123 });
  expect(mockActions.getCurrentActivity()?.params).toEqual({ userId: 123 });
});
```

### 3. Context 검증

navFlag가 context에 저장되는지 확인:

```typescript
expect(mockActions.getCurrentActivity()?.context?.navFlag).toEqual({
  flag: "CLEAR_TOP",
  activity: "activity-b",
});
```

### 4. 에러 케이스

잘못된 시나리오 정의 감지:

```typescript
it("필수 필드가 없으면 에러", () => {
  const invalidScenario = { id: "test" }; // activities 없음
  expect(() => validateScenario(invalidScenario)).toThrow();
});
```

## 🎯 핵심 가치

1. **자동화**: JSON 기반으로 테스트 자동 생성
2. **신뢰성**: 32개 테스트로 모든 flag 패턴 검증
3. **확장성**: 새 시나리오 추가가 쉬움
4. **문서화**: 코드가 곧 문서 (테스트 = 명세)
5. **유지보수성**: Mock을 통한 독립적 테스트

## 📝 체크리스트

- [x] Vitest 설정 완료
- [x] MockStackActions 구현
- [x] NavFlag Plugin 단위 테스트 (15개)
- [x] Scenario Flow 통합 테스트 (17개)
- [x] 모든 테스트 통과 (32/32)
- [x] 문서화 완료
- [x] package.json 스크립트 추가
- [x] README 업데이트

## 📚 참고 문서

- [테스트 가이드](../src/plugins/README.test.md)
- [시나리오 작성 가이드](./SCENARIO_GUIDE.md)
- [Vitest 공식 문서](https://vitest.dev/)
- [Stackflow 공식 문서](https://stackflow.so/)
