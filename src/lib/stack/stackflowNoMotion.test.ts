import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STACKFLOW_NO_MOTION_ATTR,
  shouldSuppressMotionForDispatchEvent,
  shouldSuppressMotionForPopArgs,
  withTemporaryStackflowNoMotion,
} from "./stackflowNoMotion";

describe("stackflowNoMotion", () => {
  afterEach(() => {
    document.documentElement.removeAttribute(STACKFLOW_NO_MOTION_ATTR);
    vi.restoreAllMocks();
  });

  it("keeps the no-motion flag until the second animation frame settles", () => {
    const frames: FrameRequestCallback[] = [];

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    withTemporaryStackflowNoMotion(() => {
      expect(
        document.documentElement.getAttribute(STACKFLOW_NO_MOTION_ATTR),
      ).toBe("true");
    });

    expect(document.documentElement.getAttribute(STACKFLOW_NO_MOTION_ATTR)).toBe(
      "true",
    );

    frames.shift()?.(0);
    expect(document.documentElement.getAttribute(STACKFLOW_NO_MOTION_ATTR)).toBe(
      "true",
    );

    frames.shift()?.(0);
    expect(
      document.documentElement.hasAttribute(STACKFLOW_NO_MOTION_ATTR),
    ).toBe(false);
  });

  it("detects dispatch events that should suppress motion", () => {
    expect(
      shouldSuppressMotionForDispatchEvent("Pushed", {
        skipEnterActiveState: true,
      }),
    ).toBe(true);
    expect(
      shouldSuppressMotionForDispatchEvent("Replaced", {
        skipEnterActiveState: true,
      }),
    ).toBe(true);
    expect(
      shouldSuppressMotionForDispatchEvent("Popped", {
        skipExitActiveState: true,
      }),
    ).toBe(true);
    expect(
      shouldSuppressMotionForDispatchEvent("Popped", {
        skipExitActiveState: false,
      }),
    ).toBe(false);
  });

  it("treats animate:false and multi-pop calls as no-motion cases", () => {
    expect(shouldSuppressMotionForPopArgs({ animate: false })).toBe(true);
    expect(shouldSuppressMotionForPopArgs(1, { animate: false })).toBe(true);
    expect(shouldSuppressMotionForPopArgs(2)).toBe(true);
    expect(shouldSuppressMotionForPopArgs(1, { animate: true })).toBe(false);
  });
});
