import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createTestStackflow,
  getActiveActivities,
  getActiveActivityNames,
  getTopActivity,
} from "./helpers";

describe("stackflow basic flow", () => {
  it("initializes with a single root activity", () => {
    const { instance } = createTestStackflow();
    const active = getActiveActivities(instance);

    expect(active).toHaveLength(1);
    expect(active[0]?.isRoot).toBe(true);
    expect(active[0]?.isTop).toBe(true);
    expect(active[0]?.isActive).toBe(true);
  });

  it("push updates top activity and params", () => {
    const { instance } = createTestStackflow();

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    const top = getTopActivity(instance);
    expect(top?.name).toBe("detail");
    expect(top?.params.id).toBe("1");
  });

  it("replace marks previous activity as exited and enters new activity", () => {
    const { instance } = createTestStackflow();

    act(() => {
      instance.actions.replace("detail", { id: "2" }, { animate: false });
    });

    const activities = instance.actions.getStack().activities;
    const exited = activities.find((activity) => activity.exitedBy);
    const top = getTopActivity(instance);

    expect(exited?.exitedBy?.name).toBe("Replaced");
    expect(top?.enteredBy.name).toBe("Replaced");
  });

  it("pop returns to previous activity", () => {
    const { instance } = createTestStackflow();

    act(() => {
      instance.actions.push("detail", { id: "3" });
    });
    act(() => {
      instance.actions.pop({ animate: false });
    });

    const top = getTopActivity(instance);
    expect(top?.name).toBe("home");
  });

  it("pop is a no-op on root-only stack", () => {
    const { instance } = createTestStackflow();

    act(() => {
      instance.actions.pop({ animate: false });
    });

    expect(getActiveActivities(instance)).toHaveLength(1);
    expect(getTopActivity(instance)?.name).toBe("home");
  });

  it("skipEnterActiveState forces enter-done", () => {
    const { instance } = createTestStackflow({ transitionDuration: 150 });

    act(() => {
      instance.actions.push("detail", { id: "4" }, { animate: false });
    });

    const top = getTopActivity(instance);
    expect(top?.transitionState).toBe("enter-done");
  });

  it("skipExitActiveState forces exit-done", () => {
    const { instance } = createTestStackflow({ transitionDuration: 150 });

    act(() => {
      instance.actions.push("detail", { id: "5" });
    });
    act(() => {
      instance.actions.pop({ animate: false });
    });

    const exited = instance.actions
      .getStack()
      .activities.find((activity) => activity.name === "detail");
    expect(exited?.transitionState).toBe("exit-done");
  });

  it("transitions set loading then return to idle", () => {
    vi.useFakeTimers();

    try {
      const { instance } = createTestStackflow({ transitionDuration: 200 });

      act(() => {
        instance.actions.push("detail", { id: "6" });
      });

      expect(instance.actions.getStack().globalTransitionState).toBe("loading");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(instance.actions.getStack().globalTransitionState).toBe("idle");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stepPush/stepReplace/stepPop follow step rules", () => {
    const { instance } = createTestStackflow();

    const initial = getTopActivity(instance);
    expect(initial?.steps).toHaveLength(1);

    act(() => {
      instance.actions.stepPush({ step: "one" });
    });

    const afterPush = getTopActivity(instance);
    expect(afterPush?.steps).toHaveLength(2);
    expect(afterPush?.params.step).toBe("one");

    const prevStepId = afterPush?.steps[1]?.id;

    act(() => {
      instance.actions.stepReplace({ step: "two" });
    });

    const afterReplace = getTopActivity(instance);
    const nextStepId = afterReplace?.steps[1]?.id;

    expect(afterReplace?.steps).toHaveLength(2);
    expect(afterReplace?.params.step).toBe("two");
    expect(nextStepId).not.toBe(prevStepId);

    act(() => {
      instance.actions.stepPop();
    });

    const afterPop = getTopActivity(instance);
    expect(afterPop?.steps).toHaveLength(1);
  });

  it("stepPop is no-op when only one step exists", () => {
    const { instance } = createTestStackflow();
    const before = getTopActivity(instance);

    act(() => {
      instance.actions.stepPop();
    });

    const after = getTopActivity(instance);
    expect(after?.steps).toHaveLength(1);
    expect(after?.steps[0]?.id).toBe(before?.steps[0]?.id);
  });

  it("pause queues events and resume applies them", () => {
    vi.useFakeTimers();

    try {
      const { instance } = createTestStackflow({ transitionDuration: 200 });

      act(() => {
        instance.actions.dispatchEvent("Paused", {});
      });
      act(() => {
        instance.actions.push("detail", { id: "7" });
      });

      expect(getActiveActivityNames(instance)).toEqual(["home"]);
      expect(instance.actions.getStack().globalTransitionState).toBe("paused");
      expect(instance.actions.getStack().pausedEvents?.length).toBeGreaterThan(0);

      act(() => {
        instance.actions.dispatchEvent("Resumed", {});
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(getActiveActivityNames(instance)).toEqual(["home", "detail"]);
      expect(instance.actions.getStack().globalTransitionState).toBe("idle");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reuses activity index when activityId is duplicated", () => {
    const { instance } = createTestStackflow();
    const rootId = instance.actions.getStack().activities[0]?.id ?? "root";

    act(() => {
      instance.actions.dispatchEvent("Pushed", {
        activityId: rootId,
        activityName: "detail",
        activityParams: {},
        skipEnterActiveState: true,
      });
    });

    const active = getActiveActivities(instance);
    expect(active).toHaveLength(1);
    expect(active[0]?.name).toBe("detail");
  });
});
