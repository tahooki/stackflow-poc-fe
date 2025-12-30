# Stackflow 스택 제거 제약 정리

코어는 이벤트 기반으로 스택을 갱신하며, 제거는 `pop`(top)과 `replace`(top 교체)만 가능하다.

## 1) 가장 오래된 activity 제거가 불가능한 이유

핵심은 `pop`이 **특정 activity를 지정할 수 없고**, 항상 **최신(최상단) activity**만 대상으로 삼는 구조다.

### 원인 코드 1: PoppedEvent에 타겟 정보가 없음

```ts
// node_modules/@stackflow/core/src/event-types/PoppedEvent.ts
export type PoppedEvent = BaseDomainEvent<
  "Popped",
  {
    skipExitActiveState?: boolean;
    activityContext?: {};
  }
>;
```

`PoppedEvent`에는 `activityId` 같은 타겟 지정 필드가 없다.

### 원인 코드 2: Popped는 최신 activity만 타겟

```ts
// node_modules/@stackflow/core/src/activity-utils/findTargetActivityIndices.ts
case "Popped": {
  const sorted = activities
    .filter(isActivityNotExited)
    .sort(compareActivitiesByEventDate);

  const latestActivity = sorted.slice(0, sorted.length - 1)[0];

  if (latestActivity) {
    targetActivities.push(activities.indexOf(latestActivity));
  }
  break;
}
```

`Popped`는 항상 **가장 최근 activity**만 처리한다.  
따라서 “가장 오래된 activity만 제거”는 코어만으로 불가능하다.

## 2) push 후 몇 초 뒤 이전 페이지를 지울 수 없는 이유

`push` 직후의 “이전 페이지”는 top이 아니므로 `pop`으로 제거할 수 없다.  
그리고 코어에는 “특정 activity를 지목해 제거”하는 액션이 없다.

### 원인 코드 1: 삭제 액션이 pop/replace 뿐

```ts
// node_modules/@stackflow/core/src/interfaces/StackflowActions.ts
export type StackflowActions = {
  getStack: () => Stack;
  dispatchEvent: DispatchEvent;
  push: (params: Omit<PushedEvent, keyof BaseDomainEvent>) => void;
  replace: (params: Omit<ReplacedEvent, keyof BaseDomainEvent>) => void;
  pop: (params?: Omit<PoppedEvent, keyof BaseDomainEvent>) => void;
  // ...
};
```

삭제 관련 액션은 `pop/replace`뿐이고, 둘 다 **top만 대상**이다.

### 원인 코드 2: Popped는 최신 activity만 타겟

```ts
// node_modules/@stackflow/core/src/activity-utils/findTargetActivityIndices.ts
case "Popped": {
  const sorted = activities
    .filter(isActivityNotExited)
    .sort(compareActivitiesByEventDate);

  const latestActivity = sorted.slice(0, sorted.length - 1)[0];

  if (latestActivity) {
    targetActivities.push(activities.indexOf(latestActivity));
  }
  break;
}
```

`pop`은 결국 최신 activity만 제거하므로, “몇 초 뒤 이전 페이지(2번째)만 제거”는 구현할 수 없다.

## 플러그인으로도 불가능한 이유

플러그인은 **이벤트를 가로채거나(Pre-effect)**, **스택을 읽는 것**까지만 가능하다.  
스택 내부 배열을 직접 수정하거나, pop 대상 선택 로직을 바꾸는 API는 없다.

### 플러그인 훅이 제공하는 것 (가능 범위)

```ts
// node_modules/@stackflow/core/src/interfaces/StackflowPluginHook.ts
export type StackflowPluginPreEffectHook<T> = (args: {
  actionParams: T;
  actions: StackflowActions & {
    preventDefault: () => void;
    overrideActionParams: (params: T) => void;
  };
}) => void;
```

`preventDefault()`로 기본 동작을 막고 `dispatchEvent(...)`로 기존 이벤트만 발생시킬 수 있다.

### 플러그인에서 스택은 "읽기 전용"

```ts
// node_modules/@stackflow/core/src/interfaces/StackflowActions.ts
export type StackflowActions = {
  getStack: () => Stack;
  dispatchEvent: DispatchEvent;
  push: (...args) => void;
  replace: (...args) => void;
  pop: (...args) => void;
  // ...
};
```

`getStack()`은 조회만 가능하고, 스택을 직접 수정하는 함수는 없다.

### 불가능한 예시: "7초 뒤 이전 화면만 제거"

- 플러그인에서 `setTimeout` 후 `pop()`을 호출하면 **top만 제거**된다.
- “이전 화면(2번째)”을 지정할 수 있는 API가 없어서 원하는 타겟을 제거할 수 없다.

## 우회 방법 비교표

| 방법          | 가능한 동작                         | 장점                      | 단점                       | 상태/스크롤   |
| ------------- | ----------------------------------- | ------------------------- | -------------------------- | ------------- |
| replace 전환  | depth 제한 시 push를 replace로 변경 | 구현 간단, 스택 폭발 방지 | 오래된 항목 직접 제거 불가 | 대부분 유지   |
| 스택 재구성   | pop으로 비우고 필요한 화면만 재push | 오래된 항목 제외 가능     | 전환/상태 손실 큼          | 대부분 초기화 |
| 렌더러 커스텀 | 스택은 유지, DOM만 언마운트         | 메모리 절감 가능          | 뒤로가면 리마운트 필요     | 복원 어려움   |

## 정리

- 코어: pop 대상은 항상 최신 activity로 고정
- 플러그인: 스택 읽기 + 이벤트 가로채기만 가능
