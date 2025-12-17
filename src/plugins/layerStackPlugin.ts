import type { StackflowReactPlugin } from "@stackflow/react";

import { getLayerController } from "../lib/layerManager";
import type { StackName } from "../stack/stackConfig";

export const layerStackPlugin =
  (stackName: StackName): StackflowReactPlugin =>
  () => {
    const controller = getLayerController(stackName);

    return {
      key: `layer-stack-plugin:${stackName}`,
      onInit: ({ actions }) => {
        controller.attach(actions);
      },
      onChanged: ({ actions }) => {
        controller.syncFromStack(actions.getStack());
      },
    };
  };
