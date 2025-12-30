import type { StackflowReactPlugin } from "@stackflow/react";

export type DepthBackPolicyOptions = {
  maxVisible: number;
};

export const depthBackPolicyPlugin =
  (options: DepthBackPolicyOptions): StackflowReactPlugin =>
  () => ({
    key: "depth-back-policy",
    onBeforePop: ({ actions }) => {
      const maxVisible = Math.max(0, options.maxVisible);
      if (maxVisible === 0) {
        return;
      }

      const stack = actions.getStack();
      const activeActivities = stack.activities.filter(
        (activity) => !activity.exitedBy
      );
      const activeCount = activeActivities.length;

      if (activeCount !== maxVisible + 1) {
        return;
      }

      actions.preventDefault();
      // Skip to root when the stack is about to reveal hidden screens.
      for (let i = 0; i < activeCount - 1; i += 1) {
        actions.dispatchEvent("Popped", { skipExitActiveState: true });
      }
    },
  });
