import { useCallback, useMemo } from "react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import type { StackName } from "../stack/stackConfig";
import type { StackFlag } from "../plugins/stackFlagPlugin";
import { STACK_FLAG_INTERNAL_FIELD } from "../plugins/stackFlagPlugin";
import type { StackInstance } from "../lib/stack/createStackflowInstance";

type UnknownRecord = Record<string, unknown>;

export type StackPushOptions = {
  stack?: StackName;
  animate?: boolean;
  stackFlag?: StackFlag;
};

export const useStackActions = () => {
  const { stackManager, activeStack, setActiveStack } = useStacks();
  const scope = useOptionalStackScope();

  const defaultStack = scope?.stackName ?? activeStack;

  const getStack = useCallback(
    (stackName?: StackName) => stackManager.getStack(stackName ?? defaultStack),
    [defaultStack, stackManager]
  );

  const switchStack = useCallback(
    (stackName: StackName) => setActiveStack(stackName),
    [setActiveStack]
  );

  const push = useCallback(
    (
      activityName: Parameters<StackInstance["actions"]["push"]>[0],
      params: Parameters<StackInstance["actions"]["push"]>[1],
      options?: StackPushOptions
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const { stackFlag, animate } = options ?? {};
      const payload =
        stackFlag && params && typeof params === "object"
          ? ({
              ...(params as UnknownRecord),
              [STACK_FLAG_INTERNAL_FIELD]: stackFlag,
            } as typeof params)
          : stackFlag
          ? ({
              [STACK_FLAG_INTERNAL_FIELD]: stackFlag,
            } as typeof params)
          : params;

      const baseOptions = typeof animate === "boolean" ? { animate } : undefined;
      return stackManager
        .getStack(targetStack)
        .actions.push(activityName, payload, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stackManager]
  );

  const replace = useCallback(
    (
      activityName: Parameters<StackInstance["actions"]["replace"]>[0],
      params: Parameters<StackInstance["actions"]["replace"]>[1],
      options?: Omit<StackPushOptions, "stackFlag"> & { stack?: StackName }
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const baseOptions =
        options && typeof options.animate === "boolean"
          ? { animate: options.animate }
          : undefined;

      return stackManager
        .getStack(targetStack)
        .actions.replace(activityName, params, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stackManager]
  );

  const pop = useCallback(
    (...args: Parameters<StackInstance["actions"]["pop"]>) => {
      return getStack().actions.pop(...args);
    },
    [getStack]
  );

  const stepPush = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepPush"]>) => {
      return getStack().actions.stepPush(...args);
    },
    [getStack]
  );

  const stepReplace = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepReplace"]>) => {
      return getStack().actions.stepReplace(...args);
    },
    [getStack]
  );

  const stepPop = useCallback(
    (...args: Parameters<StackInstance["actions"]["stepPop"]>) => {
      return getStack().actions.stepPop(...args);
    },
    [getStack]
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
    ]
  );
};

export type { StackFlag } from "../plugins/stackFlagPlugin";
