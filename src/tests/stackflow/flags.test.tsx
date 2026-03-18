import { act } from "@testing-library/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { describe, expect, it } from "vitest";

import {
  stackFlagPlugin,
  STACK_FLAG_INTERNAL_FIELD,
  type StackFlag,
} from "../../plugins/stackFlagPlugin";
import {
  createTestStackflow,
  getTopActivity,
} from "./helpers";

type StackFlagPayload = StackFlag | { type: "CLEAR_TOP"; activity: string };

const pushWithFlag = (
  instance: ReturnType<typeof createTestStackflow>["instance"],
  activityName: string,
  flag: StackFlagPayload,
  params: Record<string, unknown> = {},
  options?: { animate?: boolean },
) => {
  act(() => {
    instance.actions.push(activityName, {
      ...params,
      [STACK_FLAG_INTERNAL_FIELD]: flag,
    }, options);
  });
};

describe("stackFlag plugin behavior", () => {
  it("sanitizes stackFlag payload from params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    pushWithFlag(instance, "detail", "SINGLE_TOP");

    const top = getTopActivity(instance);
    expect(top?.params[STACK_FLAG_INTERNAL_FIELD]).toBeUndefined();
  });

  it("SINGLE_TOP creates a new top activity when top matches", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    pushWithFlag(instance, "detail", "SINGLE_TOP", { id: "2" });

    const details = instance.actions
      .getStack()
      .activities.filter((activity) => activity.name === "detail");
    expect(details.length).toBe(2);
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_TOP rewinds to target activity", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(instance, "detail", { type: "CLEAR_TOP", activity: "detail" });

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_STACK clears all and pushes new activity", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(instance, "snapshot", "CLEAR_STACK");

    const detail = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "detail");
    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(detail?.exitedBy?.name).toBe("Replaced");
    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("snapshot");
  });

  it("CLEAR_STACK with animate false skips exit-active on cleared activities", () => {
    const { instance } = createTestStackflow({
      transitionDuration: 150,
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(
      instance,
      "snapshot",
      "CLEAR_STACK",
      {},
      { animate: false },
    );

    const detail = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "detail");
    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(detail?.transitionState).toBe("exit-done");
    expect(orders?.transitionState).toBe("exit-done");
    expect(getTopActivity(instance)?.transitionState).toBe("enter-done");
  });

  it("CLEAR_TOP without target falls back to a normal push", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    pushWithFlag(instance, "orders", "CLEAR_TOP");

    expect(getTopActivity(instance)?.name).toBe("orders");
  });

  it("without plugin, stackFlag payload stays in params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin()],
    });

    act(() => {
      instance.actions.push("detail", {
        [STACK_FLAG_INTERNAL_FIELD]: "SINGLE_TOP",
      });
    });

    const top = getTopActivity(instance);
    expect(top?.params[STACK_FLAG_INTERNAL_FIELD]).toBeDefined();
  });
});
