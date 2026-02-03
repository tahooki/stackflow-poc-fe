# Test Overview

이 문서는 현재 레포에 있는 테스트 코드가 무엇을 검증하는지 전체적으로 요약합니다.

## 범위

테스트는 `src/tests/stackflow/` 아래에 있으며, Vitest + React Testing Library 환경에서 Stackflow 동작을 검증합니다.

## 테스트 파일 요약

- `src/tests/stackflow/basic.test.tsx`: 기본 스택 흐름을 검증합니다. 초기 루트 액티비티, `push/replace/pop` 동작, 전환 상태(`enter-done/exit-done`), 전역 트랜지션 상태(`loading → idle`), 스텝 기반 액션(`stepPush/stepReplace/stepPop`), `pause/resume` 이벤트 큐잉, 중복 `activityId` 처리(인덱스 재사용)를 확인합니다.
- `src/tests/stackflow/depth-renderer.test.tsx`: `depthRendererPlugin`이 렌더링 깊이를 제한하는지 확인합니다. `maxVisible` 적용, 깊이 감소 시 `floorIndex` 리셋, `exit-done` 액티비티 필터링, `maxVisible=0`일 때 전체 렌더링을 검증합니다.
- `src/tests/stackflow/flags.test.tsx`: `stackFlagPlugin`의 플래그 동작을 검증합니다. 플래그 파라미터 제거(sanitize), `SINGLE_TOP`, `CLEAR_TOP`, `CLEAR_STACK`, `JUMP_TO`, `CLEAR_TOP_SINGLE_TOP`, `JUMP_TO_CLEAR_TOP` 시나리오와 플러그인 미사용 시 파라미터 유지 동작을 확인합니다.
- `src/tests/stackflow/multi-stack.test.tsx`: 여러 스택 인스턴스가 서로 독립된 히스토리를 유지하는지 확인합니다.
- `src/tests/stackflow/plugin.test.tsx`: 커스텀 플러그인의 훅 호출 순서(`onBeforePush`, `onPushed`, `onChanged`)와 `preventDefault`로 `pop`을 막는 동작을 검증합니다.
- `src/tests/stackflow/scroll.test.tsx`: 이전 액티비티로 돌아왔을 때 스크롤 위치가 보존되는지 확인합니다.
- `src/tests/stackflow/stack-manager.test.ts`: `StackManager`가 스택을 생성하고 설정을 노출하는지, `depthRenderer` 옵션 오버라이드, 활성 스택 변경 구독, 히스토리 기록/팝, 초기 스택 리셋 동작을 검증합니다.
- `src/tests/stackflow/use-stack-actions.test.tsx`: `useStackActions` 훅이 스택 스코프를 기본 타겟으로 사용하고, `stack` 옵션이 활성 스택 전환에 반영되며, 플래그(`SINGLE_TOP`)가 적용될 때 액티비티 교체 및 파라미터 정리가 되는지 확인합니다.

## 공통 테스트 유틸

- `src/tests/stackflow/helpers.tsx`: 테스트용 Stackflow 인스턴스 생성, 기본 액티비티 구성, 활성 액티비티/상단 액티비티 조회 유틸을 제공합니다.

## 사용자 관점에서 보장되는 동작

- 화면 전환이 기본 규칙대로 동작한다: 처음 진입 시 루트 화면이 뜨고, `push/replace/pop`으로 이동·되돌아가기가 정상적으로 일어난다.
- 뒤로가기 시 이전 화면이 복원된다: `pop` 이후 이전 액티비티가 다시 top으로 돌아오며 스택이 유지된다.
- 스크롤 위치가 유지된다: 상세 화면에 갔다가 돌아왔을 때 이전 화면의 스크롤이 그대로 남는다.
- 동일 화면 재진입 정책이 맞게 적용된다: `SINGLE_TOP`, `CLEAR_TOP`, `CLEAR_STACK` 등 플래그에 따라 중복 진입/정리/점프 규칙이 기대대로 실행된다.
- 화면이 많이 쌓여도 렌더링이 제한된다: 깊이가 커졌을 때 `maxVisible` 기준으로 필요한 화면만 보여 성능 저하를 방지한다.
- 탭/스택 분리가 보장된다: 다른 스택의 화면 이동이 내 스택에 영향을 주지 않는다.
- 커스텀 네비게이션 훅이 개입 가능하다: 플러그인이 사전 차단(prevent)하거나 이벤트를 감지할 수 있어 사용자 흐름 제어가 가능하다.
- 스택 관리자 동작이 일관된다: 활성 스택 전환, 히스토리 기록/복원, 초기 스택 리셋이 안정적으로 동작한다.
- 액션 훅이 올바른 스택을 대상으로 작동한다: `useStackActions`가 스코프/옵션에 맞는 스택으로 이동시킨다.

## 사용자 관점 상세 (it 기준)

**`src/tests/stackflow/basic.test.tsx`**
- `initializes with a single root activity`: 앱 첫 진입 시 빈 화면 없이 루트 화면이 정상 노출된다.
- `push updates top activity and params`: 화면 이동 시 파라미터가 정상 전달되어 상세 화면에 올바른 데이터가 표시된다.
- `replace marks previous activity as exited and enters new activity`: replace 이동에서 이전 화면이 정상 종료되어 겹침/잔상이 없다.
- `pop returns to previous activity`: 뒤로가기 시 직전 화면으로 정확히 복귀한다.
- `pop is a no-op on root-only stack`: 루트에서 뒤로가기 시 앱이 빈 상태가 되지 않는다.
- `skipEnterActiveState forces enter-done`: 애니메이션 없는 진입에서도 화면이 멈추지 않고 바로 표시된다.
- `skipExitActiveState forces exit-done`: 애니메이션 없는 이탈에서도 이전 화면이 DOM에 남지 않는다.
- `transitions set loading then return to idle`: 전환 상태가 끝나지 않고 멈추는 현상을 방지한다.
- `stepPush/stepReplace/stepPop follow step rules`: 한 화면 내 단계 이동(예: 결제 단계)에서 단계/파라미터가 일관된다.
- `stepPop is no-op when only one step exists`: 단계가 1개뿐일 때 잘못된 이전 단계로 이동하지 않는다.
- `pause queues events and resume applies them`: 백그라운드/포그라운드 전환 시 누락된 이동이 복구된다.
- `reuses activity index when activityId is duplicated`: 동일 ID 재사용 시 화면이 중복 생성되지 않아 상태가 꼬이지 않는다.

**`src/tests/stackflow/depth-renderer.test.tsx`**
- `limits rendered activities to maxVisible`: 스택이 커져도 화면 렌더링 수를 제한해 성능 저하를 막는다.
- `resets floorIndex when depth drops under maxVisible`: 뒤로가기 후 이전 화면이 다시 보이도록 복원된다.
- `filters out exit-done activities`: 종료된 화면이 DOM에 남아 이벤트 충돌을 일으키지 않는다.
- `renders all activities when maxVisible is zero`: 제한을 끌 수 있어 디버깅/특수 화면 노출이 가능하다.

**`src/tests/stackflow/flags.test.tsx`**
- `sanitizes stackFlag payload from params`: 내부 플래그가 화면 파라미터에 노출되지 않아 데이터 오염을 막는다.
- `SINGLE_TOP creates a new top activity when top matches`: 동일 화면 재진입 정책이 정의된 대로 실행되어 상태 갱신이 가능하다.
- `CLEAR_TOP rewinds to target activity`: 중간 화면을 정리하고 지정 화면으로 빠르게 복귀한다.
- `CLEAR_STACK clears all and pushes new activity`: 전체 스택 리셋(예: 로그아웃/온보딩 재시작)이 가능하다.
- `JUMP_TO forces navigation to target activity`: 호출 위치와 무관하게 지정 화면으로 바로 이동한다.
- `CLEAR_TOP_SINGLE_TOP falls back to SINGLE_TOP when target is missing`: 대상이 없어도 안전하게 이동이 계속된다.
- `CLEAR_TOP_SINGLE_TOP rewinds when target exists`: 대상이 있을 땐 중복 없이 복귀한다.
- `JUMP_TO_CLEAR_TOP rewinds when target exists`: 대상이 있을 땐 정리 후 진입한다.
- `JUMP_TO_CLEAR_TOP pushes target when missing`: 대상이 없으면 새로 진입해 이동이 실패하지 않는다.
- `without plugin, stackFlag payload stays in params`: 플러그인 미설치 시 동작/데이터가 예측 가능하다.

**`src/tests/stackflow/multi-stack.test.tsx`**
- `maintains independent histories per stack instance`: 다른 탭/스택의 이동이 내 스택에 영향을 주지 않는다.

**`src/tests/stackflow/plugin.test.tsx`**
- `fires before/after hooks for push`: 이동 전후 훅으로 가드/로깅/분석이 정상 동작한다.
- `preventDefault stops pop`: 저장되지 않은 변경 등에서 뒤로가기를 막을 수 있다.

**`src/tests/stackflow/scroll.test.tsx`**
- `keeps scroll position when returning to previous activity`: 목록으로 돌아왔을 때 스크롤 위치가 유지된다.

**`src/tests/stackflow/stack-manager.test.ts`**
- `builds stacks and exposes config entries`: 설정한 스택이 실제로 생성되어 화면 구성 누락을 막는다.
- `applies depthRenderer overrides when creating stacks`: 스택별 렌더링 제한이 적용되어 성능 정책을 지킨다.
- `tracks active stack changes and notifies subscribers`: 탭 전환 등에서 UI가 즉시 반응한다.
- `honors recordHistory false and pops history`: 히스토리 기록 옵션이 정확히 반영되어 뒤로가기 동작이 예측 가능하다.
- `resets to init stack and clears history`: 초기 화면으로 확실히 복귀해 흐름을 재시작할 수 있다.

**`src/tests/stackflow/use-stack-actions.test.tsx`**
- `uses stack scope as default target`: 스코프 내부 액션이 올바른 스택으로 이동해 잘못된 탭 전환을 막는다.
- `push with stack option switches active stack`: 명시한 스택으로 이동하면서 활성 탭이 올바르게 전환된다.
- `push with flag replaces top activity and sanitizes params`: 플래그가 적용되고 내부 파라미터가 제거되어 화면 상태가 깨지지 않는다.

## 실행

- `npm test`
