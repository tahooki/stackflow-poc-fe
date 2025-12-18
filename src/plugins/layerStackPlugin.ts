import type { StackflowReactPlugin } from "@stackflow/react";

import { Cfg } from "../config/Cfg";
import type { StackName } from "../stack/stackConfig";

export const layerStackPlugin =
  (stackName: StackName): StackflowReactPlugin =>
  () => {
    const controller = Cfg.getLayer().getController(stackName);

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
