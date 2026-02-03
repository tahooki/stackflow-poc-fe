# Stack Manager 설정/사용 가이드 (이 레포 기준)

이 문서는 `/Users/tahooki/Documents/git/stackflow-poc-fe`에 구현된 **StackManager 중심 구조**를 기준으로,
설정 방법, 사용 방법, Flag 패턴, Stackflow 기본 함수(액션) 기능을 한 번에 정리합니다.

참조 파일
- 설정: `src/stack/stackConfig.ts`
- 초기화: `src/config/Cfg.ts`, `src/App.tsx`
- StackManager: `src/stack/stackManager.ts`
- Stackflow 인스턴스 생성: `src/lib/stack/createStackflowInstance.ts`
- 컨텍스트/렌더링: `src/contexts/StackContext.tsx`
- Flag 플러그인: `src/plugins/stackFlagPlugin.ts`
- 사용 예시: `src/activities/HomeActivity.tsx`, `src/activities/DetailActivity.tsx`

---

## 1. 구성 개요

- 이 레포는 **스택(탭) 단위로 Stackflow 인스턴스를 여러 개 생성**합니다.
- `StackManager`는 스택 인스턴스 생성/활성화/히스토리 관리를 담당합니다.
- `LayerManager`는 스택 내부 레이어(Activity/Step/Overlay) 상태를 관리합니다.
- `BackManager`는 레이어 pop → 스택 히스토리 pop 순서로 back 동작을 조정합니다.

---

## 2. 설정 가이드

### 2-1. Activity 등록

`activityRoutes`에 화면을 등록합니다. 여기서 `ActivityRegistry`가 만들어집니다.

```ts
// src/stack/stackConfig.ts
const activityRoutes = [
  { name: "home", activity: HomeActivity },
  { name: "detail", activity: DetailActivity },
  { name: "orders", activity: OrdersActivity },
  { name: "snapshot", activity: SnapshotActivity },
  { name: "modal", activity: ModalLabActivity },
] as const;
```

### 2-2. Stack 목록 구성

스택은 `stackList`에 정의합니다.

주의: `initialActivity`는 반드시 `activities`에 포함되어야 합니다.

```ts
// src/stack/stackConfig.ts
const stackList = [
  {
    name: "home",
    label: "Home",
    initialActivity: "home",
    activities: activityRoutes,
  },
  {
    name: "orders",
    label: "Orders",
    initialActivity: "orders",
    activities: activityRoutes,
  },
  {
    name: "snapshot",
    label: "Snapshot",
    initialActivity: "snapshot",
    activities: activityRoutes,
  },
] as const;
```

### 2-3. StackManagerConfig 작성

`initStack`, `stackList`, `depthRenderer`를 설정합니다.

```ts
// src/stack/stackConfig.ts
export const stackManagerConfig = {
  initStack: "home",
  stackList,
  depthRenderer: {
    maxVisible: 5,
    // stackOverrides: { orders: 3 },
  },
} as const;
```

---

## 3. 초기화 가이드

### 3-1. Cfg.init 호출

`Cfg.init()`를 앱 시작 시 1회 호출해야 합니다.

```tsx
// src/App.tsx
useEffect(() => {
  if (!Cfg.isInitialized()) {
    Cfg.init({
      stack: stackManagerConfig,
      layer: {},
    });
    setReady(true);
  }
}, []);
```

### 3-2. StackProvider로 렌더링

`StackProvider` 내부에서 모든 스택이 렌더링됩니다.
한 번 활성화된 스택은 계속 마운트되어 **스크롤 상태가 유지**됩니다.

```tsx
// src/App.tsx
<GlobalLayout>
  <StackProvider>
    <AppShell />
  </StackProvider>
</GlobalLayout>
```

---

## 4. Stackflow 기본 함수 기능 정리

이 레포에서 실제로 사용하는 Stackflow 인스턴스/액션 API 기준입니다.

### 4-1. stackflow() 반환값

- `Stack`: 해당 스택을 렌더링하는 React 컴포넌트.
- `actions`: 스택 조작 API 모음.
- `addActivity({ name, component })`: Activity 등록.
- `useFlow`: Activity 흐름(state/transition) 구독 훅.
- `useStepFlow`: Step 흐름 구독 훅.

사용 예시

```ts
// src/lib/stack/createStackflowInstance.ts
const instance = stackflow<ActivityRegistry>({
  transitionDuration: 350,
  activities: {} as ActivityRegistry,
  initialActivity: () => initialActivity,
  plugins: [/* ... */],
});

instance.addActivity({ name, component: activity });
```

### 4-2. actions API

- `actions.push(activityName, params, options)`
  - 새 Activity를 스택 top에 추가합니다.
  - `options.animate`를 `false`로 주면 전환이 즉시 완료됩니다.
- `actions.replace(activityName, params, options)`
  - 현재 top Activity를 교체합니다.
- `actions.pop(options)`
  - top Activity를 제거합니다.
  - root만 남아있을 경우 no-op입니다.
- `actions.stepPush(params)`
  - 현재 Activity에 step을 추가합니다.
- `actions.stepReplace(params)`
  - 마지막 step을 교체합니다.
- `actions.stepPop()`
  - 마지막 step을 제거합니다.
  - step이 1개뿐이면 no-op입니다.
- `actions.getStack()`
  - 현재 스택 상태를 조회합니다.
- `actions.dispatchEvent(type, payload)`
  - core 이벤트를 직접 발행합니다.
  - 예: `Paused`, `Resumed`, `Pushed`, `Replaced`, `Popped`, `StepPushed`.

이 동작은 `src/tests/stackflow/basic.test.tsx`의 케이스로 검증되어 있습니다.

---

## 5. StackManager 사용 가이드

### 5-1. 활성 스택 조회/전환

```ts
const { activeStack, setActiveStack } = useStacks();
setActiveStack("orders");
```

히스토리를 남기지 않으려면 `StackManager` 직접 호출합니다.

```ts
stackManager.setActiveStack("orders", { recordHistory: false });
```

### 5-2. 액션 호출 (useStackActions)

```ts
const { push, replace, pop } = useStackActions();

push("detail", { params: { id: "1" } });
push("detail", { stack: "orders", params: { id: "200" } }); // 타 스택

replace("snapshot", { params: {} });
pop();
```

`useStackActions()`는 **현재 StackScope 또는 activeStack**을 기본 대상으로 사용합니다.

---

## 6. Flag 패턴 가이드

### 6-1. 기본 원칙

- Flag는 **push 액션에서만 동작**합니다.
- `stackFlagPlugin`이 `onBeforePush`에서 동작하며 기본 push를 대체합니다.
- `useStackActions`의 `flag` 옵션을 사용하면 내부 필드(`__stackFlag`)는 자동으로 제거됩니다.

사용 예시

```ts
import { StackFlagSingleTop } from "../plugins/stackFlagPlugin";

push("detail", {
  params: { id: "1" },
  flag: new StackFlagSingleTop(),
});
```

### 6-2. Flag별 동작과 사용 시점

| Flag | 동작 요약 | 이런 경우에 사용 |
|---|---|---|
| `SINGLE_TOP` | top이 동일하면 `replace`, 아니면 `push` | 동일 화면 중복을 막고 싶을 때 |
| `CLEAR_TOP(activity)` | 대상이 스택에 있으면 그 위를 pop 후 `replace`, 없으면 원래 요청을 `push` | 특정 화면으로 돌아가며 그 위 history를 정리할 때 |
| `CLEAR_STACK` | 전체 pop 후 새 화면 `push` | 로그인 후 홈으로 리셋, 딥링크 리셋 |
| `JUMP_TO(activity)` | 요청 화면을 무시하고 지정한 화면을 `push` | 호출 위치와 무관하게 특정 화면으로 강제 이동할 때 |
| `CLEAR_TOP_SINGLE_TOP(activity)` | `CLEAR_TOP` 시도, 실패 시 `SINGLE_TOP` 규칙 적용 | 대상이 있으면 정리하고, 없으면 중복 방지 |
| `JUMP_TO_CLEAR_TOP(activity)` | 대상이 있으면 pop 후 `replace`, 없으면 그 대상 `push` | 항상 특정 화면에 도착해야 하고, 있으면 위를 정리해야 할 때 |

### 6-3. 플래그 선택 빠른 매핑

- 중복 방지: `SINGLE_TOP`
- 특정 화면까지 되감기: `CLEAR_TOP(target)`
- 완전 초기화: `CLEAR_STACK`
- 강제 리다이렉트: `JUMP_TO(target)`
- 되감기 + 중복 방지 혼합: `CLEAR_TOP_SINGLE_TOP(target)`
- 항상 target로 이동 + 위 정리: `JUMP_TO_CLEAR_TOP(target)`

---

## 7. 추가 참고

- Flag 구현: `src/plugins/stackFlagPlugin.ts`
- StackManager 동작 흐름: `docs/stack-managers.md`
- Stackflow core 동작 요약: `docs/stackflow-core-basics.md`

