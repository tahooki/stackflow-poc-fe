import { useCallback, useMemo } from "react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import type { StackName } from "../stack/stackConfig";
import type { StackFlag } from "../plugins/stackFlagPlugin";
import { STACK_FLAG_INTERNAL_FIELD } from "../plugins/stackFlagPlugin";
import type { StackInstance } from "../lib/stack/createStackflowInstance";

type UnknownRecord = Record<string, unknown>;

type StackPushParams = Parameters<StackInstance["actions"]["push"]>[1];
type StackReplaceParams = Parameters<StackInstance["actions"]["replace"]>[1];
type StackActivityName = Parameters<StackInstance["actions"]["push"]>[0];

export type StackPushOptions = {
  params?: StackPushParams;
  stack?: StackName;
  animate?: boolean;
  flag?: StackFlag;
  flagTargetActivity?: StackActivityName;
};

export type StackReplaceOptions = {
  params?: StackReplaceParams;
  stack?: StackName;
  animate?: boolean;
};

export const useStackActions = () => {
  const { stackManager, activeStack, setActiveStack } = useStacks();
  const scope = useOptionalStackScope();

  const defaultStack = scope?.stackName ?? activeStack;

  const getStack = useCallback(
    (stackName?: StackName) => stackManager.getStack(stackName ?? defaultStack),
    [defaultStack, stackManager],
  );

  const switchStack = useCallback(
    (stackName: StackName) => setActiveStack(stackName),
    [setActiveStack],
  );

  const push = useCallback(
    (
      activityName: StackActivityName,
      options?: StackPushOptions,
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const params = options?.params;
      const stackFlag = options?.flag;
      const flagTargetActivity = options?.flagTargetActivity;
      const { animate } = options ?? {};
      const resolvedFlag =
        stackFlag === "CLEAR_TOP" && flagTargetActivity
          ? { type: "CLEAR_TOP" as const, activity: flagTargetActivity }
          : stackFlag;
      const payload =
        resolvedFlag && params && typeof params === "object"
          ? ({
              ...(params as UnknownRecord),
              [STACK_FLAG_INTERNAL_FIELD]: resolvedFlag,
            } as typeof params)
          : resolvedFlag
            ? ({
                [STACK_FLAG_INTERNAL_FIELD]: resolvedFlag,
              } as typeof params)
            : params;

      const baseOptions =
        typeof animate === "boolean" ? { animate } : undefined;
      return stackManager
        .getStack(targetStack)
        .actions.push(activityName, payload || {}, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stackManager],
  );

  const replace = useCallback(
    (
      activityName: Parameters<StackInstance["actions"]["replace"]>[0],
      options?: StackReplaceOptions,
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const baseOptions =
        options && typeof options.animate === "boolean"
          ? { animate: options.animate }
          : undefined;
      const params = options?.params || {};

      return stackManager
        .getStack(targetStack)
        .actions.replace(activityName, params, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stackManager],
  );

  const pop = useCallback(
    (...args: Parameters<StackInstance["actions"]["pop"]>) => {
      return getStack().actions.pop(...args);
    },
    [getStack],
  );

  const stepPush = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepPush"]>) => {
      return getStack().actions.stepPush(...args);
    },
    [getStack],
  );

  const stepReplace = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepReplace"]>) => {
      return getStack().actions.stepReplace(...args);
    },
    [getStack],
  );

  const stepPop = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepPop"]>) => {
      return getStack().actions.stepPop(...args);
    },
    [getStack],
  );

  const useFlow = useMemo(() => getStack().useFlow, [getStack]);
  const useStepFlow = useMemo(() => getStack().useStepFlow, [getStack]);

  return useMemo(
    () => ({
      stackName: defaultStack,
      activeStack,
      switchStack,
      getStack,
      useFlow,
      useStepFlow,
      push,
      replace,
      pop,
      stepPush,
      stepReplace,
      stepPop,
    }),
    [
      activeStack,
      defaultStack,
      getStack,
      useFlow,
      useStepFlow,
      pop,
      push,
      replace,
      stepPop,
      stepPush,
      stepReplace,
      switchStack,
    ],
  );
};

export type { StackFlag } from "../plugins/stackFlagPlugin";
