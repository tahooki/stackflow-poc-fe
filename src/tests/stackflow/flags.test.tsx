import { act } from "@testing-library/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { describe, expect, it } from "vitest";

import {
  stackFlagPlugin,
  STACK_FLAG_INTERNAL_FIELD,
  StackFlagClearStack,
  StackFlagClearTop,
  StackFlagClearTopSingleTop,
  StackFlagJumpTo,
  StackFlagJumpToClearTop,
  StackFlagSingleTop,
  type StackFlag,
} from "../../plugins/stackFlagPlugin";
import { createTestStackflow, getTopActivity } from "./helpers";

const pushWithFlag = (
  instance: ReturnType<typeof createTestStackflow>["instance"],
  activityName: string,
  flag: StackFlag,
  params: Record<string, string | undefined> = {}
) => {
  act(() => {
    instance.actions.push(activityName, {
      ...params,
      [STACK_FLAG_INTERNAL_FIELD]: flag,
    });
  });
};

describe("stackFlag plugin behavior", () => {
  it("sanitizes stackFlag payload from params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    pushWithFlag(instance, "detail", new StackFlagSingleTop());

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

    pushWithFlag(instance, "detail", new StackFlagSingleTop(), { id: "2" });

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

    pushWithFlag(instance, "detail", new StackFlagClearTop("detail"));

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

    pushWithFlag(instance, "snapshot", new StackFlagClearStack());

    const detail = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "detail");
    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(detail?.exitedBy?.name).toBe("Popped");
    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("snapshot");
  });

  it("JUMP_TO forces navigation to target activity", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    pushWithFlag(instance, "orders", new StackFlagJumpTo("detail"));

    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_TOP_SINGLE_TOP falls back to SINGLE_TOP when target is missing", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    pushWithFlag(
      instance,
      "detail",
      new StackFlagClearTopSingleTop("orders")
    );

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders).toBeUndefined();
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("JUMP_TO_CLEAR_TOP rewinds when target exists", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), stackFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(
      instance,
      "orders",
      new StackFlagJumpToClearTop("detail")
    );

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("without plugin, stackFlag payload stays in params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin()],
    });

    act(() => {
      instance.actions.push("detail", {
        [STACK_FLAG_INTERNAL_FIELD]: new StackFlagSingleTop(),
      });
    });

    const top = getTopActivity(instance);
    expect(top?.params[STACK_FLAG_INTERNAL_FIELD]).toBeDefined();
  });
});
