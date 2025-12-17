import { useCallback, useMemo } from "react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import type { StackName } from "../stack/stackConfig";
import type { NavFlag } from "../plugins/navFlagPlugin";
import { NAV_FLAG_INTERNAL_FIELD } from "../plugins/navFlagPlugin";

type UnknownRecord = Record<string, unknown>;

export type StackPushOptions = {
  stack?: StackName;
  animate?: boolean;
  navFlag?: NavFlag;
};

export const useStackActions = () => {
  const { stacks, activeStack, setActiveStack } = useStacks();
  const scope = useOptionalStackScope();

  const defaultStack = scope?.stackName ?? activeStack;

  const getStack = useCallback(
    (stackName?: StackName) => stacks[stackName ?? defaultStack],
    [defaultStack, stacks]
  );

  const switchStack = useCallback(
    (stackName: StackName) => setActiveStack(stackName),
    [setActiveStack]
  );

  const push = useCallback(
    (
      activityName: Parameters<(typeof stacks)[StackName]["actions"]["push"]>[0],
      params: Parameters<(typeof stacks)[StackName]["actions"]["push"]>[1],
      options?: StackPushOptions
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const { navFlag, animate } = options ?? {};
      const payload =
        navFlag && params && typeof params === "object"
          ? ({
              ...(params as UnknownRecord),
              [NAV_FLAG_INTERNAL_FIELD]: navFlag,
            } as typeof params)
          : navFlag
          ? ({
              [NAV_FLAG_INTERNAL_FIELD]: navFlag,
            } as typeof params)
          : params;

      const baseOptions = typeof animate === "boolean" ? { animate } : undefined;
      return stacks[targetStack].actions.push(activityName, payload, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stacks]
  );

  const replace = useCallback(
    (
      activityName: Parameters<(typeof stacks)[StackName]["actions"]["replace"]>[0],
      params: Parameters<(typeof stacks)[StackName]["actions"]["replace"]>[1],
      options?: Omit<StackPushOptions, "navFlag"> & { stack?: StackName }
    ) => {
      const targetStack = options?.stack ?? defaultStack;

      if (targetStack !== activeStack) {
        setActiveStack(targetStack);
      }

      const baseOptions =
        options && typeof options.animate === "boolean"
          ? { animate: options.animate }
          : undefined;

      return stacks[targetStack].actions.replace(activityName, params, baseOptions);
    },
    [activeStack, defaultStack, setActiveStack, stacks]
  );

  const pop = useCallback(
    (...args: Parameters<(typeof stacks)[StackName]["actions"]["pop"]>) => {
      return getStack().actions.pop(...args);
    },
    [getStack]
  );

  const stepPush = useCallback(
    (...args: Parameters<(typeof stacks)[StackName]["actions"]["stepPush"]>) => {
      return getStack().actions.stepPush(...args);
    },
    [getStack]
  );

  const stepReplace = useCallback(
    (
      ...args: Parameters<(typeof stacks)[StackName]["actions"]["stepReplace"]>
    ) => {
      return getStack().actions.stepReplace(...args);
    },
    [getStack]
  );

  const stepPop = useCallback(
    (...args: Parameters<(typeof stacks)[StackName]["actions"]["stepPop"]>) => {
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

export type { NavFlag } from "../plugins/navFlagPlugin";
