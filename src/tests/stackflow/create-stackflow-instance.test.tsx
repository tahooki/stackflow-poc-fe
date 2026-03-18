import type { ActivityComponentType } from "@stackflow/react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSetGroupLayers = vi.fn();
const mockPruneOrphanedOverlays = vi.fn();
const mockGetController = vi.fn(() => ({
  setGroupLayers: mockSetGroupLayers,
  pruneOrphanedOverlays: mockPruneOrphanedOverlays,
}));

vi.mock("../../config/Cfg", () => ({
  Cfg: {
    getLayer: () => ({
      getController: mockGetController,
    }),
  },
}));

import { createStackflowInstance } from "../../lib/stack/createStackflowInstance";
import { STACKFLOW_NO_MOTION_ATTR } from "../../lib/stack/stackflowNoMotion";
import { STACK_FLAG_INTERNAL_FIELD } from "../../plugins/stackFlagPlugin";
import type { StackRouteConfig } from "../../stack/stackConfig";

const HomeActivityStub: ActivityComponentType<{ highlight?: string }> = ({
  params,
}) => <div data-testid="activity-home">{params.highlight ?? "home"}</div>;

const DetailActivityStub: ActivityComponentType<{ id: string }> = ({
  params,
}) => <div data-testid="activity-detail">{params.id}</div>;

const OrdersActivityStub: ActivityComponentType = () => (
  <div data-testid="activity-orders">orders</div>
);

const activityRoutes = [
  { name: "home", activity: HomeActivityStub },
  { name: "detail", activity: DetailActivityStub },
  { name: "orders", activity: OrdersActivityStub },
] as unknown as ReadonlyArray<StackRouteConfig>;

describe("createStackflowInstance", () => {
  beforeEach(() => {
    mockGetController.mockClear();
    mockSetGroupLayers.mockClear();
    mockPruneOrphanedOverlays.mockClear();
    document.documentElement.removeAttribute(STACKFLOW_NO_MOTION_ATTR);
  });

  it("wraps CLEAR_STACK push with no-motion and keeps the root activity visible", () => {
    const frames: FrameRequestCallback[] = [];

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    const instance = createStackflowInstance({
      stackName: "home",
      initialActivity: "home",
      routes: activityRoutes,
    });

    render(<instance.Stack />);

    act(() => {
      instance.actions.push("detail", { id: "10" });
      instance.actions.push("orders", {});
    });

    act(() => {
      instance.actions.push(
        "home",
        {
          highlight: "Cleared by flag",
          [STACK_FLAG_INTERNAL_FIELD]: "CLEAR_STACK",
        } as Record<string, unknown>,
      );
    });

    expect(mockGetController).toHaveBeenCalledWith("home");
    expect(document.documentElement.getAttribute(STACKFLOW_NO_MOTION_ATTR)).toBe(
      "true",
    );

    const stack = instance.actions.getStack();
    const activeActivities = stack.activities.filter(
      (activity) => activity.transitionState !== "exit-done",
    );
    const poppedNames = stack.activities
      .filter((activity) => activity.exitedBy?.name === "Popped")
      .map((activity) => activity.name);
    const replacedNames = stack.activities
      .filter((activity) => activity.exitedBy?.name === "Replaced")
      .map((activity) => activity.name);
    const top = activeActivities[activeActivities.length - 1];
    const topParams = top?.params as Record<string, unknown> | undefined;

    expect(activeActivities).toHaveLength(2);
    expect(activeActivities[0]?.name).toBe("home");
    expect(top?.name).toBe("home");
    expect(top?.transitionState).toBe("enter-done");
    expect(topParams?.highlight).toBe("Cleared by flag");
    expect(topParams?.[STACK_FLAG_INTERNAL_FIELD]).toBeUndefined();
    expect(poppedNames).toEqual(["orders"]);
    expect(replacedNames).toEqual(["detail"]);

    while (frames.length > 0) {
      frames.shift()?.(0);
    }

    expect(
      document.documentElement.hasAttribute(STACKFLOW_NO_MOTION_ATTR),
    ).toBe(false);
  });
});
