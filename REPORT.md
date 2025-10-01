# 성능 테스트 결과

- 테스트 목적
  - React DOM 렌더링과 무관하게 메모리 압박만으로 애니메이션 저하가 발생하는지 검증
  - 스택이 깊어질수록 이전 화면 렌더를 차단하는 전략 필요성은 인지했으나, 본 테스트 범위에서는 제외
- 테스트 환경
  - 단말: Galaxy S20 Ultra (저장소 256g / 램 16g ) (Note20 부재 시 대체)
  - 플레이그라운드: https://stackflow-poc-fe.vercel.app/
- 테스트 절차
  - `Open memory stress activity` 클릭으로 스트레스 시나리오 진입
  - `Push another 5MB screen`을 반복해 약 50 MiB까지 메모리를 누적
  - `Push text activity`로 일반 화면을 추가하며 전환 애니메이션 관찰
- 관측 결과
  - 50 MiB 누적 상태에서 추가로 메모리를 쌓으면 브라우저 탭이 바로 종료됨
  - 50 MiB 누적 후 일반 컴포넌트 전환 애니메이션은 눈에 띄는 저하 없이 유지됨
- 50 MiB가 의미하는 데이터 규모
  - 50 MiB = 52,428,800바이트 (브라우저 메모리 표기 기준)
  - ASCII 문자열 ≈ 5,242만 글자 / 한글 문자열(3바이트) ≈ 1,748만 글자 / 대부분의 이모지(4바이트) ≈ 1,310만 글자
  - JSON 예시 (공백 미포함 기준)
    - 숫자 배열 `[12345,12346,…]`: 원소당 ≈6바이트 → 약 874만 개 숫자
    - 짧은 영문 문자열 배열 `"abcd"`: 원소당 ≈7바이트 → 약 749만 개 문자열
    - 짧은 한글 문자열 배열 `"가나다라"`: 원소당 ≈15바이트 → 약 349만 개 문자열
    - 작은 객체 `{"id":123456,"name":"aaaaaa","desc":"bbbbbb"}`: 객체당 ≈46바이트 → 약 114만 개 객체
- 결론 및 인사이트
  - 메모리 사용량만으로는 전환 애니메이션이 크게 느려지지 않았으며, 실제 성능 저하는 React 렌더링 제어 전략에 달려 있음을 확인
  - Stackflow 활용 시 비활성 화면 렌더 차단과 같은 렌더링 최적화가 핵심 포인트임

# 테스트 코드 성공 사례

## 📌 배경 및 목표

### 문제 정의

Stackflow의 Navigation Flag 패턴(Android Intent Flag 방식)이 올바르게 동작하는지 검증할 방법이 필요했습니다. 수동 테스트는 시간이 오래 걸리고 회귀 버그 발견이 어려웠습니다.

### 목표

- ✅ JSON 기반 시나리오 정의로 테스트 자동화
- ✅ 7가지 Navigation Flag 패턴의 정확한 동작 검증
- ✅ 새로운 시나리오 추가 시 자동으로 테스트 생성
- ✅ CI/CD 파이프라인에 통합 가능한 테스트 시스템 구축

## 🎯 구현 내용

### 1. 시나리오 기반 테스트 시스템

**JSON으로 시나리오 정의** → **자동으로 테스트 생성** → **Flag 패턴 검증**

```
defaultScenarios.json (시나리오 정의)
           ↓
   scenarioDefinitions (로더)
           ↓
   테스트 코드 자동 실행
           ↓
   Flag 패턴 동작 검증 ✓
```

### 2. 검증한 Navigation Flag 패턴 (7가지)

| Flag                     | 동작                               | 테스트 여부 |
| ------------------------ | ---------------------------------- | :---------: |
| **PUSH**                 | 스택에 새 액티비티 추가            |     ✅      |
| **SINGLE_TOP**           | 최상단 동일 시 재진입, 다르면 push |     ✅      |
| **CLEAR_TOP**            | 대상까지 스택을 되감고 재진입      |     ✅      |
| **CLEAR_STACK**          | 전체 스택 초기화 후 시작           |     ✅      |
| **JUMP_TO**              | 지정한 액티비티로 강제 이동        |     ✅      |
| **CLEAR_TOP_SINGLE_TOP** | CLEAR_TOP 실패 시 SINGLE_TOP 동작  |     ✅      |
| **JUMP_TO_CLEAR_TOP**    | 스택에 있으면 되감기, 없으면 push  |     ✅      |

### 3. 테스트 시나리오 구성 (4개 시나리오)

#### ✅ 시나리오 1: 스택 기본 흐름

- A → B → C 순서로 PUSH
- C에서 CLEAR_TOP으로 B 복귀
- CLEAR_STACK으로 A 초기화

#### ✅ 시나리오 2: JUMP_TO 이동

- targetActivityId 무시하고 navFlag.activity로 이동
- 스택과 관계없이 강제 이동 동작 확인

#### ✅ 시나리오 3: CLEAR_TOP_SINGLE_TOP 조합

- 대상이 스택에 있으면 CLEAR_TOP 동작
- 대상이 없으면 SINGLE_TOP 동작으로 전환

#### ✅ 시나리오 4: JUMP_TO_CLEAR_TOP 이동

- 스택에 있으면 되감기
- 스택에 없으면 새로 push

## 📊 테스트 결과

### 전체 테스트 성공률: 100% (32/32)

```
✅ NavFlag Plugin 단위 테스트: 15개 통과
   - PUSH (2 tests)
   - SINGLE_TOP (2 tests)
   - CLEAR_TOP (2 tests)
   - CLEAR_STACK (2 tests)
   - JUMP_TO (2 tests)
   - CLEAR_TOP_SINGLE_TOP (3 tests)
   - JUMP_TO_CLEAR_TOP (2 tests)

✅ 시나리오 플로우 통합 테스트: 17개 통과
   - 시나리오 1: stack-basic-flow (5 tests)
   - 시나리오 2: jump-to-flow (2 tests)
   - 시나리오 3: clear-top-single-top-flow (3 tests)
   - 시나리오 4: jump-to-clear-top-flow (3 tests)
   - 메타 검증 (4 tests)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Files: 2 passed (2)
Tests: 32 passed (32) ✅
Duration: 990ms
```

### 실행 방법

```bash
# Watch 모드 (개발 중)
npm test

# 단일 실행 (CI용)
npm run test:run

# UI 모드 (브라우저)
npm run test:ui
```

## 💡 핵심 성과

### 1. 자동화 달성

- **이전**: 수동으로 각 시나리오를 클릭하며 테스트 (1시간+)
- **이후**: `npm test` 한 번으로 모든 시나리오 검증 (1초)
- **효과**: **3600배 속도 향상** 🚀

### 2. 신뢰성 확보

- 32개 테스트로 모든 flag 패턴 검증
- 회귀 버그 즉시 감지 가능
- CI/CD 파이프라인 통합 준비 완료

### 3. 확장성 제공

새로운 시나리오 추가가 매우 간단합니다:

```json
// defaultScenarios.json에 추가만 하면
{
  "id": "new-scenario",
  "title": "새 시나리오",
  "activities": [...]
}

// 자동으로 테스트 실행됨!
```

### 4. 문서화 효과

- 테스트 코드 = 동작 명세서
- 새로운 팀원도 코드만 보면 이해 가능
- 각 flag의 정확한 동작 문서화

## 🔧 기술 스택

- **Vitest**: 빠른 테스트 실행 (Vite 기반)
- **React Testing Library**: React 컴포넌트 테스트
- **MockStackActions**: Stackflow 스택 시뮬레이션
- **TypeScript**: 타입 안정성 보장

## 📁 생성된 파일 구조

```
src/
├── plugins/
│   ├── navFlagPlugin.test.ts        # Flag 단위 테스트 (15 tests)
│   └── README.test.md               # 테스트 가이드
├── scenarios/
│   ├── scenarioFlow.test.ts         # 시나리오 통합 테스트 (17 tests)
│   └── defaultScenarios.json        # 시나리오 정의
├── test-utils/
│   ├── setup.ts                     # Vitest 설정
│   └── mockStackActions.ts          # 스택 Mock 시스템
└── docs/
    ├── SCENARIO_GUIDE.md            # 시나리오 작성 가이드
    └── TEST_SUMMARY.md              # 작업 전체 요약
```

## 🎓 얻은 교훈

### 1. JSON 기반 시나리오의 힘

- 개발자가 아니어도 시나리오 추가 가능
- 테스트 케이스를 코드가 아닌 데이터로 관리
- 시나리오 재사용 및 조합 가능

### 2. Mock의 중요성

- 실제 Stackflow 없이도 테스트 가능
- 빠른 테스트 실행 (1초 이내)
- 독립적인 테스트 환경 보장

### 3. 테스트 코드의 가치

- 개발 초기에 시간이 걸리지만
- 장기적으로 유지보수 비용 대폭 절감
- 자신감 있는 리팩토링 가능

# 프레임워크 DX KIT 개발 (연구중)

## `src/lib/dx-kit` 캡슐 구성

- PerfHUD: FPS, JS Heap, Long Task를 requestAnimationFrame/PerformanceObserver 기반으로 측정하는 실시간 HUD
  (가치: 성능 저하 신호를 즉시 감지해 릴리즈 전에 대응 계획을 세울 수 있음)
- RerenderHeatmap: 리렌더된 컴포넌트를 외곽선과 배지로 표시해 불필요한 렌더링을 즉시 식별
  (가치: 병목이 되는 컴포넌트를 시각적으로 골라내 최적화 우선순위를 빠르게 정함)
- LeakHUD & useLeakWatch: WeakRef + FinalizationRegistry로 언마운트 후 GC되지 않는 컴포넌트를 경고
  (가치: 장기 세션에서 누적되는 메모리 누수를 조기에 발견해 모바일 크래시를 예방)
- OccupancyHUD 패밀리: 렌더·커밋·이벤트·Effect 시간을 수집해 메인 스레드 점유율 상위를 정리
  (가치: CPU 점유가 높은 구간을 데이터로 제시하며 팀 내 리소스 투입을 설득)
- JankAnalyzer: 스크롤 중 프레임 드롭 구간에 마커를 그려 사용자 체감 저크를 시각화
  (가치: UX팀과 함께 실제 사용감 저해 지점을 공유하며 백로그 우선순위를 조정)
- StateSnapshotPanel: 특정 시점의 상태를 저장 후 복원해 디버그 세션을 재생
  (가치: 재현 어려운 버그를 스냅샷으로 묶어 QA↔개발 간 핸드오프 시간을 단축)
