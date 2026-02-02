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

## 실행

- `npm test`
