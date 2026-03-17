import type {
  StackflowActions,
  StackflowPluginPreEffectHook,
} from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

/**
 * Android의 Intent Flag 개념을 Stackflow에 이식한 플러그인 구현.
 * 호출부는 stackFlag만 지정하고, 실제 스택 조정은 모두 플러그인에서 처리하도록 강제합니다.
 */
export type StackFlagKind =
  | "SINGLE_TOP"
  | "CLEAR_TOP"
  | "CLEAR_STACK";

export type StackFlag = StackFlagKind;

type ClearTopFlagPayload = {
  type: "CLEAR_TOP";
  activity: string;
};

type StackFlagPayload = StackFlag | ClearTopFlagPayload;

/**
 * 호출부에서 주입하는 내부 키. 실제 params로 전달되지는 않도록 sanitize 단계에서 제거합니다.
 */
const STACK_FLAG_FIELD = "__stackFlag";

type UnknownRecord = Record<string, unknown>;

type PushActionParams = Parameters<StackflowActions["push"]>[0];

type ActivityParamsShape = PushActionParams["activityParams"] & UnknownRecord;
type ActivityContextShape = PushActionParams["activityContext"] & UnknownRecord;

type StackFlagCarrier = UnknownRecord & { [STACK_FLAG_FIELD]?: StackFlagPayload };

const isStackFlagKind = (value: unknown): value is StackFlagKind =>
  value === "SINGLE_TOP" ||
  value === "CLEAR_TOP" ||
  value === "CLEAR_STACK";

/**
 * params/context 객체에 섞여 들어온 내부 키를 제거합니다.
 * 단순 Object spread로 복사하면서 __stackFlag 필드를 제외합니다.
 */
const sanitizeRecord = <T extends UnknownRecord | undefined>(params: T): T => {
  if (!params || typeof params !== "object") {
    return params;
  }

  if (!Object.prototype.hasOwnProperty.call(params, STACK_FLAG_FIELD)) {
    return params;
  }

  const rest = { ...(params as StackFlagCarrier) };
  delete rest[STACK_FLAG_FIELD];
  return rest as T;
};

/**
 * params에 숨겨둔 stackFlag 정보를 추출합니다. 없으면 undefined 반환.
 */
const pickStackFlag = (
  params: UnknownRecord | undefined
): StackFlagPayload | undefined => {
  if (!params || typeof params !== "object") {
    return undefined;
  }

  const candidate = (params as StackFlagCarrier)[STACK_FLAG_FIELD];
  if (typeof candidate === "string" && isStackFlagKind(candidate)) {
    return candidate;
  }

  if (
    candidate &&
    typeof candidate === "object" &&
    candidate.type === "CLEAR_TOP" &&
    typeof candidate.activity === "string"
  ) {
    return candidate;
  }

  return undefined;
};

/**
 * onBeforePush 훅: 플래그를 읽고 기본 push 동작을 대체하거나 수정합니다.
 */
const handleBeforePush: StackflowPluginPreEffectHook<PushActionParams> = ({
  actionParams,
  actions,
}) => {
  const stackFlag = pickStackFlag(
    actionParams.activityParams as UnknownRecord | undefined
  );

  if (!stackFlag) {
    // 플래그는 없지만 내부 키가 남아있다면, 호출부 params가 노출되지 않도록 제거합니다.
    if (
      Object.prototype.hasOwnProperty.call(
        actionParams.activityParams ?? {},
        STACK_FLAG_FIELD
      )
    ) {
      actions.overrideActionParams({
        ...actionParams,
        activityParams: sanitizeRecord(
          actionParams.activityParams as UnknownRecord
        ) as ActivityParamsShape,
      });
    }
    return;
  }

  // 기본 push를 막고 플래그에 따라 직접 push/pop/replace 시퀀스를 실행합니다.
  actions.preventDefault();

  const sanitizedParams = sanitizeRecord(
    actionParams.activityParams as UnknownRecord
  ) as ActivityParamsShape;
  const sanitizedContext = sanitizeRecord(
    actionParams.activityContext as UnknownRecord | undefined
  ) as ActivityContextShape | undefined;

  const stack = actions.getStack();
  const activeActivities = stack.activities.filter(
    (activity) => activity.transitionState !== "exit-done"
  );
  const top = activeActivities[activeActivities.length - 1];
  const shouldSkipExitActiveState = actionParams.skipEnterActiveState === true;

  const dispatchPush = (
    activityName: string,
    skipEnterActiveState = actionParams.skipEnterActiveState
  ) => {
    actions.dispatchEvent("Pushed", {
      activityId: actionParams.activityId,
      activityName,
      activityParams: sanitizedParams,
      activityContext: sanitizedContext,
      skipEnterActiveState,
    });
  };

  const dispatchReplace = (
    activityName: string,
    skipEnterActiveState = actionParams.skipEnterActiveState
  ) => {
    actions.dispatchEvent("Replaced", {
      activityId: actionParams.activityId,
      activityName,
      activityParams: sanitizedParams,
      activityContext: sanitizedContext,
      skipEnterActiveState,
    });
  };

  const dispatchPopTimes = (
    count: number,
    skipExitActiveState = shouldSkipExitActiveState
  ) => {
    for (let i = 0; i < count; i += 1) {
      actions.dispatchEvent("Popped", {
        skipExitActiveState,
      });
    }
  };

  // 목표 액티비티까지 스택을 되감은 뒤 replace로 재진입.
  const rewindToActivity = (activityName: string) => {
    const index = stack.activities.findIndex(
      (activity) => activity.name === activityName
    );

    if (index < 0) {
      return false;
    }

    const popCount = stack.activities.length - index - 1;
    if (popCount > 0) {
      dispatchPopTimes(popCount);
    }
    dispatchReplace(activityName);
    return true;
  };

  const flagType = typeof stackFlag === "string" ? stackFlag : stackFlag.type;

  switch (flagType) {
    case "SINGLE_TOP": {
      // 최상단이 동일하면 replace, 아니면 push.
      if (top?.name === actionParams.activityName) {
        dispatchReplace(actionParams.activityName);
      } else {
        dispatchPush(actionParams.activityName);
      }
      break;
    }
    case "CLEAR_TOP": {
      // 대상이 스택에 있으면 위를 정리하고 replace, 없으면 새로 push.
      const targetActivity =
        typeof stackFlag === "string" ? undefined : stackFlag.activity;

      if (!targetActivity || !rewindToActivity(targetActivity)) {
        dispatchPush(actionParams.activityName);
      }
      break;
    }
    case "CLEAR_STACK": {
      // root activity 하나는 남기고, 그 위 레이어만 정리한 뒤 새 화면을 push합니다.
      const activeCount = activeActivities.length;

      if (activeCount > 1) {
        dispatchPopTimes(activeCount - 1, true);
      }
      dispatchPush(actionParams.activityName, true);
      break;
    }
    default: {
      // 안전장치: 정의되지 않은 플래그는 기본 push로 처리.
      dispatchPush(actionParams.activityName);
    }
  }
};

export const stackFlagPlugin = (): StackflowReactPlugin => () => ({
  key: "stack-flag-plugin",
  onBeforePush: handleBeforePush,
});

export const STACK_FLAG_INTERNAL_FIELD = STACK_FLAG_FIELD;
