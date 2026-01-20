# Stackflow 코어 기반 기본 동작 요약

이 문서는 `@stackflow/core` 소스 기준으로 **기본 스택 동작**을 다시 정리한 문서다.
아래 내용은 `node_modules/@stackflow/core/src` 구현을 직접 참고했다.

## 버전 기준

- `@stackflow/core`: 1.2.0 (`package.json` 기준)

## 1) 이벤트 기반 스택 파이프라인

- 모든 스택 변화는 **도메인 이벤트**로 표현된다.
- 액션 → `dispatchEvent()` → `aggregate()` → 스택 계산 → `produceEffects()` 순으로 흘러간다.
- 전환 중에는 `makeCoreStore`가 약 60fps로 **재집계 폴링**을 돌려 전환 상태를 갱신한다.

참고 파일:
- `node_modules/@stackflow/core/src/makeCoreStore.ts`
- `node_modules/@stackflow/core/src/aggregate.ts`
- `node_modules/@stackflow/core/src/produceEffects.ts`

## 2) 도메인 이벤트 종류

### 초기화/등록

- `Initialized`: `transitionDuration` 설정
- `ActivityRegistered`: 등록된 액티비티 목록 + params schema 기록

### 스택 이동

- `Pushed`: 새 액티비티 추가
- `Replaced`: 새 액티비티로 교체 (기존 액티비티는 exit 처리)
- `Popped`: 최상단 액티비티 pop (root는 pop 대상에서 제외)

### 스텝 이동

- `StepPushed`: 현재 액티비티에 step 추가
- `StepReplaced`: 마지막 step 교체
- `StepPopped`: 마지막 step 제거 (step이 1개면 no-op)

### 일시정지

- `Paused`: 스택 변경을 일시정지
- `Resumed`: 일시정지 해제 후, 누적 이벤트 재처리

참고 파일:
- `node_modules/@stackflow/core/src/event-types/*`
- `node_modules/@stackflow/core/src/interfaces/StackflowActions.ts`

## 3) 스택/액티비티 모델

- `Stack.activities`: 액티비티 배열
- 각 `Activity`는 다음을 포함한다.
  - `id`, `name`, `params`, `context`
  - `steps`: 내부 step 스택
  - `enteredBy`, `exitedBy`: 진입/이탈 이벤트 레퍼런스
  - `transitionState`: `enter-active`, `enter-done`, `exit-active`, `exit-done`
  - `isTop`, `isActive`, `isRoot`, `zIndex`

참고 파일:
- `node_modules/@stackflow/core/src/Stack.ts`
- `node_modules/@stackflow/core/src/activity-utils/makeActivityFromEvent.ts`

## 4) 전환 상태 규칙

- `Pushed`/`Replaced`는 `enter-active` 또는 `enter-done`으로 시작한다.
  - `skipEnterActiveState` 또는 전환 시간이 이미 지난 경우 `enter-done`.
- `Popped`는 `exit-active` 또는 `exit-done`.
  - `skipExitActiveState` 또는 전환 시간이 지나면 `exit-done`.
  - `exit-done` 시 **첫 step만 남기고 params/steps 초기화**한다.
- 전역 상태(`globalTransitionState`):
  - `loading`: `enter-active`/`exit-active`가 하나라도 있으면
  - `idle`: 전환 중인 항목이 없으면
  - `paused`: 일시정지 상태일 때

참고 파일:
- `node_modules/@stackflow/core/src/activity-utils/makeActivitiesReducer.ts`
- `node_modules/@stackflow/core/src/activity-utils/makeActivityReducer.ts`
- `node_modules/@stackflow/core/src/activity-utils/makeStackReducer.ts`

## 5) visible/active/top/root 계산

- visible: `enter-active`, `enter-done`, `exit-active`
- active: visible 중 **가장 마지막으로 enter 상태**인 항목
- top: visible 중 **가장 마지막 항목**
- root: `zIndex === 0` 또는 특정 replace 케이스에서 root 판정

참고 파일:
- `node_modules/@stackflow/core/src/aggregate.ts`

## 6) zIndex와 step

- `Step`은 `hasZIndex`를 통해 zIndex 누적 가산이 가능하다.
- 액티비티/step zIndex는 **visible 기준 누적 계산**으로 확정된다.

참고 파일:
- `node_modules/@stackflow/core/src/aggregate.ts`
- `node_modules/@stackflow/core/src/event-types/StepPushedEvent.ts`

## 7) 액션 처리 및 플러그인 훅

- 액션 호출 시 모든 플러그인의 **pre-effect 훅**이 실행된다.
  - `preventDefault()`로 중단 가능
  - `overrideActionParams()`로 파라미터 수정 가능
- 상태 변경 후 `produceEffects()`가 변경점을 계산하고
  **post-effect 훅**을 호출한다.

참고 파일:
- `node_modules/@stackflow/core/src/utils/makeActions.ts`
- `node_modules/@stackflow/core/src/utils/triggerPreEffectHooks.ts`
- `node_modules/@stackflow/core/src/utils/triggerPostEffectHooks.ts`
- `node_modules/@stackflow/core/src/interfaces/StackflowPlugin.ts`

## 8) 코어 제약/특이사항

- 이벤트 배열은 비어있으면 에러 (`validateEvents`).
- `Initialized` 이벤트는 1개만 허용.
- `Pushed`는 등록된 액티비티만 허용.
- `pop`은 **활성 액티비티가 1개일 때 no-op** (root 보호).
- `StepPop`은 step이 1개면 no-op.
- `activityId`가 이미 존재하는 경우 `push/replace`는 **해당 인덱스를 재사용**한다.

참고 파일:
- `node_modules/@stackflow/core/src/event-utils/validateEvents.ts`
- `node_modules/@stackflow/core/src/activity-utils/findTargetActivityIndices.ts`
- `node_modules/@stackflow/core/src/activity-utils/findNewActivityIndex.ts`

