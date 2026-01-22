import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { depthRendererPlugin } from "../../plugins/depthRendererPlugin";
import {
  createTestStackflow,
  getActiveActivities,
  getActiveActivityNames,
} from "./helpers";

const debugEnabled = Boolean(process.env.DEBUG_STACKFLOW_TESTS);

const debugStack = (
  instance: ReturnType<typeof createTestStackflow>["instance"],
  label: string
) => {
  if (!debugEnabled) return;

  const stack = instance.actions.getStack();
  const activities = stack.activities.map((activity) => ({
    name: activity.name,
    key: activity.key,
    transitionState: activity.transitionState,
  }));

  const domSummary =
    typeof document === "undefined"
      ? { dom: "unavailable" }
      : {
          rendered: Array.from(
            document.querySelectorAll("[data-testid^='activity-']")
          ).map((node) => node.getAttribute("data-testid")),
        };

  // eslint-disable-next-line no-console
  console.info(`[depth-renderer] ${label}`, {
    globalTransitionState: stack.globalTransitionState,
    activities,
    ...domSummary,
  });
};

describe("depthRenderer plugin", () => {
  it("limits rendered activities to maxVisible", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 3 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
      instance.actions.push("snapshot", { id: "4" });
    });

    debugStack(instance, "after push");

    expect(getActiveActivities(instance)).toHaveLength(5);
    expect(screen.queryByTestId("activity-home")).toBeNull();
    expect(screen.getByTestId("activity-depth")).toBeInTheDocument();
    expect(screen.getByTestId("activity-orders")).toBeInTheDocument();
    expect(screen.getByTestId("activity-snapshot")).toBeInTheDocument();
  });

  it("resets floorIndex when depth drops under maxVisible", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 3 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
      instance.actions.push("snapshot", { id: "4" });
    });

    debugStack(instance, "before pop");
    expect(screen.queryByTestId("activity-home")).toBeNull();

    act(() => {
      instance.actions.pop(2, { animate: false });
    });

    debugStack(instance, "after pop");

    expect(getActiveActivityNames(instance)).toEqual(["home", "detail", "depth"]);
    expect(screen.getByTestId("activity-home")).toBeInTheDocument();
  });

  it("filters out exit-done activities", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 5 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    debugStack(instance, "after push detail");

    act(() => {
      instance.actions.pop({ animate: false });
    });

    debugStack(instance, "after pop detail");

    expect(screen.queryByTestId("activity-detail")).toBeNull();
  });

  it("renders all activities when maxVisible is zero", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 0 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
    });

    debugStack(instance, "after push (maxVisible=0)");

    const rendered = screen.getAllByTestId(/activity-/);
    expect(rendered).toHaveLength(4);
  });
});
