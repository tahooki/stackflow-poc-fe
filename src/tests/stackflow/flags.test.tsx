import { act } from "@testing-library/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { describe, expect, it } from "vitest";

import { navFlagPlugin, NAV_FLAG_INTERNAL_FIELD, type NavFlag } from "../../plugins/navFlagPlugin";
import { createTestStackflow, getTopActivity } from "./helpers";

const pushWithFlag = (
  instance: ReturnType<typeof createTestStackflow>["instance"],
  activityName: string,
  flag: NavFlag,
  params: Record<string, string | undefined> = {}
) => {
  act(() => {
    instance.actions.push(activityName, {
      ...params,
      [NAV_FLAG_INTERNAL_FIELD]: flag,
    });
  });
};

describe("navFlag plugin behavior", () => {
  it("sanitizes navFlag payload from params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    pushWithFlag(instance, "detail", { flag: "SINGLE_TOP" });

    const top = getTopActivity(instance);
    expect(top?.params[NAV_FLAG_INTERNAL_FIELD]).toBeUndefined();
  });

  it("SINGLE_TOP creates a new top activity when top matches", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    pushWithFlag(instance, "detail", { flag: "SINGLE_TOP" }, { id: "2" });

    const details = instance.actions
      .getStack()
      .activities.filter((activity) => activity.name === "detail");
    expect(details.length).toBe(2);
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_TOP rewinds to target activity", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(instance, "detail", {
      flag: "CLEAR_TOP",
      activity: "detail",
    });

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_STACK clears all and pushes new activity", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(instance, "snapshot", { flag: "CLEAR_STACK" });

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
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    pushWithFlag(instance, "orders", { flag: "JUMP_TO", activity: "detail" });

    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("CLEAR_TOP_SINGLE_TOP falls back to SINGLE_TOP when target is missing", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    pushWithFlag(instance, "detail", {
      flag: "CLEAR_TOP_SINGLE_TOP",
      activity: "orders",
    });

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders).toBeUndefined();
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("JUMP_TO_CLEAR_TOP rewinds when target exists", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), navFlagPlugin()],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("orders", { id: "2" });
    });

    pushWithFlag(instance, "orders", {
      flag: "JUMP_TO_CLEAR_TOP",
      activity: "detail",
    });

    const orders = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "orders");

    expect(orders?.exitedBy?.name).toBe("Popped");
    expect(getTopActivity(instance)?.name).toBe("detail");
  });

  it("without plugin, navFlag payload stays in params", () => {
    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin()],
    });

    act(() => {
      instance.actions.push("detail", {
        [NAV_FLAG_INTERNAL_FIELD]: { flag: "SINGLE_TOP" },
      });
    });

    const top = getTopActivity(instance);
    expect(top?.params[NAV_FLAG_INTERNAL_FIELD]).toBeDefined();
  });
});
