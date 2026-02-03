# LayerManager/BackManager 테스트 설명

이 문서는 `LayerManager.test.tsx`, `BackManager.test.tsx`가 무엇을 검증하는지 요약한다.

## LayerManager 테스트 범위

대상 파일: `src/tests/stackflow/LayerManager.test.tsx`

검증 포인트:
1. 레이어 등록/정렬/카운트
   - `activity`, `step`, `modal`을 등록했을 때 `frames` 정렬 순서가 기대대로인지 확인한다.
   - `activityCount`, `stepCount`, `modalCount` 집계가 정확한지 확인한다.
2. 그룹 단위 교체 동작 (`setGroupLayers`)
   - 동일 그룹에 속한 레이어를 교체할 때 누락된 레이어가 제거되는지 확인한다.
   - 빈 배열로 교체하면 그룹 전체가 제거되는지 확인한다.
3. 고아 오버레이 제거 (`pruneOrphanedOverlays`)
   - 활동(Activity)이 사라진 오버레이 중 `persistAcrossActivities`가 없는 것만 삭제되는지 확인한다.
   - `persistAcrossActivities`가 있는 오버레이와 글로벌 오버레이는 유지되는지 확인한다.
4. 뒤로 가기 팝 동작 (`popTopLayer`)
   - 오버레이가 있으면 가장 최근 `openedAt`을 가진 오버레이가 먼저 팝되는지 확인한다.
   - 오버레이가 없으면 step, 그 다음 activity, 마지막은 root에서 `exit` 반환 순서인지 확인한다.

## BackManager 테스트 범위

대상 파일: `src/tests/stackflow/BackManager.test.tsx`

검증 포인트:
1. 레이어에서 back을 처리하는 경우
   - `LayerController.popTopLayer()` 결과가 `exit`이 아니면 그대로 반환되는지 확인한다.
   - 이 경우 스택 히스토리 조작이 발생하지 않는지 확인한다.
2. 레이어가 `exit`을 반환하는 경우의 스택 처리
   - 스택 히스토리에 값이 있으면 `popStackHistory()` 결과로 `popped: "stack"`이 반환되는지 확인한다.
   - 히스토리가 없으면 `resetToInitStack()`으로 초기 스택 복귀를 시도하는지 확인한다.
   - 복귀할 스택이 없으면 최종적으로 `exit`이 반환되는지 확인한다.

## 실행 방법

```bash
npm test -- src/tests/stackflow/LayerManager.test.tsx src/tests/stackflow/BackManager.test.tsx
```

## 비고

- 테스트는 `LayerManager` 내부 상태와 `BackManager`의 스택 전환 조건을 핵심 시나리오 중심으로 검증한다.
- `LayerManager`의 정렬 로직은 `activity/step`의 `zIndex`, `overlay`의 `openedAt`를 이용해 결정됨에 유의한다.
