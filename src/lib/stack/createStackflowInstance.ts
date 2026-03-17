import { stackflow } from "@stackflow/react";
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";

import {
  STACK_FLAG_INTERNAL_FIELD,
  stackFlagPlugin,
} from "../../plugins/stackFlagPlugin";
import { layerStackPlugin } from "../../plugins/layerStackPlugin";
import { depthRendererPlugin } from "../../plugins/depthRendererPlugin";
import { depthBackPolicyPlugin } from "../../plugins/depthBackPolicyPlugin";
import {
  shouldSuppressMotionForAnimateOption,
  shouldSuppressMotionForDispatchEvent,
  shouldSuppressMotionForPopArgs,
  withTemporaryStackflowNoMotion,
} from "./stackflowNoMotion";
import type {
  ActivityName,
  ActivityRegistry,
  StackName,
  StackRouteConfig,
} from "../../stack/stackConfig";

export type StackInstance = ReturnType<typeof stackflow<ActivityRegistry>>;

const shouldSuppressMotionForStackFlag = (activityParams: unknown) => {
  if (!activityParams || typeof activityParams !== "object") {
    return false;
  }

  const stackFlag = (
    activityParams as Record<string, unknown>
  )[STACK_FLAG_INTERNAL_FIELD];

  return stackFlag === "CLEAR_STACK";
};

export const createStackflowInstance = ({
  stackName,
  initialActivity,
  routes,
  maxVisible,
}: {
  stackName: StackName;
  initialActivity: ActivityName;
  routes: ReadonlyArray<StackRouteConfig>;
  maxVisible?: number;
}): StackInstance => {
  const rendererPlugin =
    maxVisible !== undefined
      ? depthRendererPlugin({ maxVisible })
    : basicRendererPlugin();

  const instance = stackflow<ActivityRegistry>({
    transitionDuration: 350,
    activities: {} as ActivityRegistry,
    initialActivity: () => initialActivity,
    plugins: [
      rendererPlugin,
      basicUIPlugin({
        theme: "cupertino",
      }),
      stackFlagPlugin(),
      ...(maxVisible !== undefined
        ? [depthBackPolicyPlugin({ maxVisible })]
        : []),
      layerStackPlugin(stackName),
    ],
  });

  routes.forEach(({ name, activity }) => {
    instance.addActivity({ name, component: activity });
  });

  const originalDispatchEvent = instance.actions.dispatchEvent;
  const originalPush = instance.actions.push;
  const originalReplace = instance.actions.replace;
  const originalPop = instance.actions.pop;

  instance.actions.dispatchEvent = ((name, parameters) => {
    if (
      shouldSuppressMotionForDispatchEvent(
        name,
        parameters as Record<string, unknown> | undefined,
      )
    ) {
      return withTemporaryStackflowNoMotion(() =>
        originalDispatchEvent(name, parameters),
      );
    }

    return originalDispatchEvent(name, parameters);
  }) as typeof instance.actions.dispatchEvent;

  instance.actions.push = ((activityName, activityParams, options) => {
    if (
      shouldSuppressMotionForAnimateOption(options) ||
      shouldSuppressMotionForStackFlag(activityParams)
    ) {
      return withTemporaryStackflowNoMotion(() =>
        originalPush(activityName, activityParams, options),
      );
    }

    return originalPush(activityName, activityParams, options);
  }) as typeof instance.actions.push;

  instance.actions.replace = ((activityName, activityParams, options) => {
    if (shouldSuppressMotionForAnimateOption(options)) {
      return withTemporaryStackflowNoMotion(() =>
        originalReplace(activityName, activityParams, options),
      );
    }

    return originalReplace(activityName, activityParams, options);
  }) as typeof instance.actions.replace;

  instance.actions.pop = ((count, options) => {
    if (shouldSuppressMotionForPopArgs(count, options)) {
      return withTemporaryStackflowNoMotion(() => originalPop(count, options));
    }

    return originalPop(count, options);
  }) as typeof instance.actions.pop;

  return instance;
};
