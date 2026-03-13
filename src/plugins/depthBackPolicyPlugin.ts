import type { StackflowReactPlugin } from "@stackflow/react";

import { withTemporaryStackflowNoMotion } from "../lib/stack/stackflowNoMotion";

export type DepthBackPolicyOptions = {
  maxVisible: number;
};

export const depthBackPolicyPlugin =
  (options: DepthBackPolicyOptions): StackflowReactPlugin =>
  () => {
    let floorIndex = 0;

    return {
      key: "depth-back-policy",
      onBeforePop: ({ actions }) => {
        const maxVisible = Math.max(0, options.maxVisible);
        if (maxVisible === 0) {
          return;
        }

        const stack = actions.getStack();
        const activeActivities = stack.activities.filter(
          (activity) => activity.transitionState !== "exit-done"
        );
        const activeCount = activeActivities.length;

        if (maxVisible > 0 && activeCount > maxVisible) {
          const overflow = activeCount - maxVisible;
          floorIndex = Math.max(floorIndex, overflow);
        } else {
          floorIndex = 0;
        }

        if (floorIndex <= 0) {
          return;
        }

        if (activeCount > floorIndex + 1) {
          return;
        }

        actions.preventDefault();
        // Skip to root when the stack is about to reveal hidden screens.
        withTemporaryStackflowNoMotion(() => {
          for (let i = 0; i < activeCount - 1; i += 1) {
            actions.dispatchEvent("Popped", { skipExitActiveState: true });
          }
        });
        // Reset the floor so the next cycle starts fresh.
        floorIndex = 0;
      },
    };
  };
