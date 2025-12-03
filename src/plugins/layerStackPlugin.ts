import type { StackflowReactPlugin } from "@stackflow/react";

import { layerController } from "../lib/layerController";

export const layerStackPlugin = (): StackflowReactPlugin => () => ({
  key: "layer-stack-plugin",
  onInit: ({ actions }) => {
    layerController.attach(actions);
  },
  onChanged: ({ actions }) => {
    layerController.syncFromStack(actions.getStack());
  },
});
