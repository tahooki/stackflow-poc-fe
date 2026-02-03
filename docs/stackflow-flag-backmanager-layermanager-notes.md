# Stackflow Flag / LayerManager / BackManager 정리 (텍스트 + 예제 코드)

이 문서는 발표용 PPT가 아니라 **텍스트 중심의 설명 + 실제 코드 예제**를 함께 묶은 메모형 문서다.
내용은 이 리포의 구현(`src/`)을 기준으로 정리했다.

## 1) 큰 그림 요약

- Stackflow는 스택형 내비게이션을 제공하고, 플러그인으로 동작을 확장한다.
- StackFlag 패턴은 push 전에 동작을 가로채서 pop/replace/push 시퀀스를 직접 만든다.
- LayerManager는 Activity/Step/Overlay를 하나의 레이어 스택으로 관리한다.
- BackManager는 레이어 pop 결과에 따라 stack 히스토리를 처리한다.

관련 파일

- `src/lib/stack/createStackflowInstance.ts`
- `src/plugins/stackFlagPlugin.ts`
- `src/hooks/useStackActions.ts`
- `src/lib/layerManager.ts`
- `src/lib/backManager.ts`

## 2) Stackflow 인스턴스 구성

Stackflow 인스턴스는 플러그인을 조합해 생성되며, 여기서 flag/layer/back 관련 플러그인이 연결된다.

```ts
// src/lib/stack/createStackflowInstance.ts
const instance = stackflow<ActivityRegistry>({
  transitionDuration: 350,
  activities: {} as ActivityRegistry,
  initialActivity: () => initialActivity,
  plugins: [
    rendererPlugin,
    basicUIPlugin({ theme: "android" }),
    stackFlagPlugin(),
    ...(depthRenderer ? [depthBackPolicyPlugin(depthRenderer)] : []),
    layerStackPlugin(stackName),
  ],
});
```

포인트

- `stackFlagPlugin`은 push 이전 훅을 등록한다.
- `layerStackPlugin`은 Stack 상태를 LayerManager에 동기화한다.

## 3) StackFlag 패턴 개요

### 3-1. 호출부에서 stackFlag 인스턴스 주입

`useStackActions.push`는 `push(activity, { params, flag, stack, animate })` 형태로 옵션을 묶고,
`options.flag`로 전달된 StackFlag 인스턴스를 내부 키(`__stackFlag`)로 payload에 숨겨 넣는다.
호출부는 문자열이 아닌 class 인스턴스를 넘겨야 한다.

```ts
// src/hooks/useStackActions.ts
const params = options?.params;
const stackFlag = options?.flag;
const { animate } = options ?? {};
const payload =
  stackFlag && params && typeof params === "object"
    ? { ...(params as UnknownRecord), [STACK_FLAG_INTERNAL_FIELD]: stackFlag }
    : stackFlag
      ? { [STACK_FLAG_INTERNAL_FIELD]: stackFlag }
      : params;

const baseOptions = typeof animate === "boolean" ? { animate } : undefined;
return stackManager
  .getStack(targetStack)
  .actions.push(activityName, payload || {}, baseOptions);
```

```ts
// 호출 예시
push("detail", {
  params: { id: "1" },
  flag: new StackFlagSingleTop(),
  animate: true,
});

push("orders", {
  params: { id: "2" },
  flag: new StackFlagClearTop("detail"),
});
```

### 3-2. 플러그인에서 플래그 처리

`onBeforePush` 훅에서 기본 push를 막고 직접 이벤트를 dispatch한다.

```ts
// src/plugins/stackFlagPlugin.ts
const handleBeforePush: StackflowPluginPreEffectHook<PushActionParams> = ({
  actionParams,
  actions,
}) => {
  const stackFlag = pickStackFlag(actionParams.activityParams as UnknownRecord);

  if (!stackFlag) {
    if (
      Object.prototype.hasOwnProperty.call(
        actionParams.activityParams ?? {},
        STACK_FLAG_FIELD,
      )
    ) {
      actions.overrideActionParams({
        ...actionParams,
        activityParams: sanitizeRecord(
          actionParams.activityParams as UnknownRecord,
        ),
      });
    }
    return;
  }

  actions.preventDefault();
  // ... 이후 stackFlag에 따라 dispatchPush/dispatchReplace/dispatchPopTimes 실행
};
```

### 3-3. Flag별 처리 요약

- `StackFlagSingleTop`: top 동일 시 replace, 아니면 push.
- `StackFlagClearTop(activity)`: 스택에 target이 있으면 그 위 pop 후 replace.
- `StackFlagClearStack`: 전체 pop 후 push.
- `StackFlagJumpTo(activity)`: 호출부와 무관하게 지정 activity push.
- `StackFlagClearTopSingleTop(activity)`: CLEAR_TOP 실패 시 SINGLE_TOP 규칙.
- `StackFlagJumpToClearTop(activity)`: 있으면 pop+replace, 없으면 push.

## 4) LayerManager 동작

### 4-1. Stack 상태 -> 레이어 상태로 변환

Stackflow의 activity/step을 레이어로 변환하고, 닫기 동작을 onClose로 연결한다.

```ts
// src/plugins/layerStackPlugin.ts
const buildStackLayers = (stack: Stack, actions: StackflowActions) => {
  const layers: LayerRegistration[] = [];
  let order = 0;

  stack.activities.forEach((activity) => {
    if (activity.transitionState === "exit-done") return;
    layers.push({
      kind: "activity",
      id: activity.id,
      name: activity.name,
      params: activity.params,
      isTop: activity.isTop,
      isRoot: activity.isRoot,
      isActive: activity.isActive,
      zIndex: activity.zIndex,
      exitedBy: activity.exitedBy?.id ?? null,
      order,
      onClose: activity.isRoot ? undefined : () => actions.pop(),
    });
    order += 1;

    const stepLayers = activity.steps.length > 1 ? activity.steps.slice(1) : [];
    stepLayers.forEach((step) => {
      layers.push({
        kind: "step",
        id: `step:${activity.id}:${step.id}`,
        activityId: activity.id,
        hasZIndex: step.hasZIndex,
        zIndex: step.zIndex,
        order,
        onClose: () => actions.stepPop({ targetActivityId: activity.id }),
      });
      order += 1;
    });
  });

  return layers;
};
```

### 4-2. LayerController 정렬 규칙

Overlay는 `openedAt/order`, Activity/Step은 `zIndex`로 정렬한다.

```ts
// src/lib/layerManager.ts
const overlayOrderBase = 1_000_000_000_000;

const getLayerOrder = (layer: LayerFrame) => {
  const base = isOverlayKind(layer.kind) ? overlayOrderBase : 0;
  if (typeof layer.order === "number") return base + layer.order;
  if (isOverlayLayer(layer)) return base + (layer.openedAt ?? 0);
  return base + layer.zIndex;
};
```

### 4-3. popTopLayer 흐름

Overlay -> Step -> Activity -> Exit 순으로 back 처리를 수행한다.

```ts
// src/lib/layerManager.ts
const topOverlay = this.getTopOverlayForActivity(topActivity?.id);
if (topOverlay) {
  this.unregisterLayer(topOverlay.id);
  topOverlay.onClose?.();
  return { popped: topOverlay.kind, targetId: topOverlay.id };
}

const topStep = this.getTopStepForActivity(topActivity.id);
if (topStep) {
  topStep.onClose?.();
  return { popped: "step", targetId: topStep.id };
}

if (!topActivity.isRoot) {
  topActivity.onClose?.();
  return { popped: "activity", targetId: topActivity.id };
}

return { popped: "exit" };
```

## 5) BackManager 흐름

BackManager는 레이어 결과가 exit일 때만 스택 히스토리를 조정한다.

```ts
// src/lib/backManager.ts
const activeStack = this.stackManager.getStackSwitchState().activeStack;
const result = await this.layerManager.getController(activeStack).popTopLayer();

if (result.popped !== "exit") return result;

const poppedStack = this.stackManager.popStackHistory();
if (poppedStack) return { popped: "stack", targetId: poppedStack };

const resetStack = this.stackManager.resetToInitStack();
if (resetStack) return { popped: "stack", targetId: resetStack };

return result;
```

## 6) Back 입력 브리지

브라우저 back이나 네이티브 back 키를 `handleBackPress`로 전달한다.

```ts
// src/hooks/useHistoryBackBridge.ts
const handlePopState = () => {
  pushGuardState();
  window.onBackKeyClick?.();
};
```

```ts
// src/hooks/useBackKeyBridge.ts
const handler = async () => {
  const result = await Cfg.getBack().handleBackPress();
  const report = window.BRIDGE?.onBackKeyReuslt;
  if (typeof report === "function") {
    report(result.popped === "exit");
  }
};
```

## 7) 데모 포인트

- Home 화면에서 `CLEAR_TOP`, `SINGLE_TOP` 버튼을 눌러 flag 동작 확인.
- Layer Devtools에서 레이어 순서/카운트 확인.
- Back 버튼/브라우저 back으로 pop 순서 확인.

관련 파일

- `src/activities/HomeActivity.tsx`
- `src/components/LayerStackDevtools.tsx`
- `src/components/BackBridgeButton.tsx`

## 8) 빠른 요약 (한 문장씩)

- Stackflow는 플러그인으로 행동을 바꾸는 스택 네비게이션이다.
- stackFlag는 push 전에 동작을 재정의해 모바일 UX를 맞춘다.
- LayerManager는 UI 레이어를 스택처럼 정렬하고 top 판단을 제공한다.
- BackManager는 레이어 pop 결과를 기준으로 stack 히스토리를 조정한다.
