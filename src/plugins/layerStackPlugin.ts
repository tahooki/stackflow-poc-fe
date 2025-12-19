import type { Stack, StackflowActions } from "@stackflow/core";
import type { StackflowReactPlugin } from "@stackflow/react";

import { Cfg } from "../config/Cfg";
import type { LayerRegistration } from "../lib/layerManager";
import type { StackName } from "../stack/stackConfig";

const buildStackLayers = (
  stack: Stack,
  actions: StackflowActions
): LayerRegistration[] => {
  const layers: LayerRegistration[] = [];
  let order = 0;

  stack.activities.forEach((activity) => {
    layers.push({
      kind: "activity",
      id: activity.id,
      name: activity.name,
      params: activity.params,
      isTop: activity.isTop,
      isRoot: activity.isRoot,
      isActive: activity.isActive,
      zIndex: activity.zIndex,
      exitedBy: activity.exitedBy,
      order,
      onClose: activity.isRoot ? undefined : () => actions.pop(),
    });
    order += 1;

    activity.steps.forEach((step) => {
      layers.push({
        kind: "step",
        id: step.id,
        activityId: activity.id,
        hasZIndex: step.hasZIndex,
        zIndex: step.zIndex,
        order,
        onClose: () =>
          actions.stepPop({
            targetActivityId: activity.id,
          }),
      });
      order += 1;
    });
  });

  return layers;
};

export const layerStackPlugin =
  (stackName: StackName): StackflowReactPlugin =>
  () => {
    const controller = Cfg.getLayer().getController(stackName);

    return {
      key: `layer-stack-plugin:${stackName}`,
      onInit: ({ actions }) => {
        const stack = actions.getStack();
        console.log("[layerStackPlugin] onInit", {
          stackName,
          activityCount: stack.activities.length,
          topActivityId: stack.activities[stack.activities.length - 1]?.id ?? null,
        });
        controller.setGroupLayers("stack", buildStackLayers(stack, actions));
        controller.pruneOrphanedOverlays(
          new Set(stack.activities.map((activity) => activity.id))
        );
      },
      onChanged: ({ actions }) => {
        const stack = actions.getStack();
        console.log("[layerStackPlugin] onChanged", {
          stackName,
          activityCount: stack.activities.length,
          topActivityId: stack.activities[stack.activities.length - 1]?.id ?? null,
        });
        controller.setGroupLayers("stack", buildStackLayers(stack, actions));
        controller.pruneOrphanedOverlays(
          new Set(stack.activities.map((activity) => activity.id))
        );
      },
    };
  };
