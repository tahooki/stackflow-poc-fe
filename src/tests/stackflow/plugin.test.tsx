import { act } from "@testing-library/react";
import type { StackflowReactPlugin } from "@stackflow/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { describe, expect, it } from "vitest";

import { createTestStackflow, getActiveActivityNames } from "./helpers";

describe("custom plugin hooks", () => {
  it("fires before/after hooks for push", () => {
    const events: string[] = [];
    const plugin: StackflowReactPlugin = () => ({
      key: "test-plugin",
      onBeforePush: () => events.push("before-push"),
      onChanged: () => events.push("changed"),
      onPushed: () => events.push("pushed"),
    });

    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), plugin],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    expect(events[0]).toBe("before-push");
    expect(events).toContain("pushed");
    expect(events).toContain("changed");
  });

  it("preventDefault stops pop", () => {
    const plugin: StackflowReactPlugin = () => ({
      key: "prevent-pop",
      onBeforePop: ({ actions }) => {
        actions.preventDefault();
      },
    });

    const { instance } = createTestStackflow({
      plugins: [basicRendererPlugin(), plugin],
    });

    act(() => {
      instance.actions.push("detail", { id: "2" });
    });

    const before = getActiveActivityNames(instance);

    act(() => {
      instance.actions.pop();
    });

    const after = getActiveActivityNames(instance);
    expect(after).toEqual(before);
  });
});
