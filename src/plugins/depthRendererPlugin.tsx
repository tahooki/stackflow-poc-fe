import type { StackflowReactPlugin } from "@stackflow/react";
import { Fragment } from "react";

export type DepthRendererOptions = {
  maxVisible: number;
};

export const depthRendererPlugin =
  (options: DepthRendererOptions): StackflowReactPlugin =>
  () => {
    let floorIndex = 0;

    return {
      key: "plugin-renderer-depth",
      render({ stack }) {
        const activities = stack
          .render()
          .activities.filter(
            (activity) => activity.transitionState !== "exit-done"
          );
        const total = activities.length;
        const maxVisible = Math.max(0, options.maxVisible);

        if (maxVisible > 0 && total > maxVisible) {
          // Keep the floor index monotonic to avoid re-mounting older screens.
          const overflow = total - maxVisible;
          floorIndex = Math.max(floorIndex, overflow);
        } else {
          floorIndex = 0;
        }

        const visibleActivities =
          floorIndex > 0 ? activities.slice(floorIndex) : activities;

        return (
          <>
            {visibleActivities.map((activity) => (
              <Fragment key={activity.key}>{activity.render()}</Fragment>
            ))}
          </>
        );
      },
    };
  };
