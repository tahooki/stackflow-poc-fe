import { describe, expect, it, vi } from "vitest";

import {
  LayerManager,
  type ActivityLayer,
  type OverlayLayer,
  type StepLayer,
} from "../../lib/layerManager";

const makeActivity = (
  overrides?: Partial<ActivityLayer>,
): ActivityLayer => ({
  kind: "activity",
  id: "activity-1",
  name: "Activity",
  zIndex: 1,
  isTop: false,
  isRoot: false,
  isActive: true,
  params: {},
  ...overrides,
});

const makeStep = (overrides?: Partial<StepLayer>): StepLayer => ({
  kind: "step",
  id: "step-1",
  activityId: "activity-1",
  zIndex: 1,
  ...overrides,
});

const makeOverlay = (overrides?: Partial<OverlayLayer>): OverlayLayer => ({
  kind: "modal",
  id: "modal-1",
  activityId: "activity-1",
  openedAt: 1,
  ...overrides,
});

describe("LayerManager", () => {
  it("registers layers, tracks counts, and orders frames", () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");

    controller.registerLayer(
      makeActivity({ id: "activity-a", zIndex: 1, isRoot: true }),
    );
    controller.registerLayer(
      makeActivity({ id: "activity-b", zIndex: 2, isRoot: false }),
    );
    controller.registerLayer(
      makeStep({ id: "step-1", activityId: "activity-b", zIndex: 3 }),
    );
    controller.registerLayer(
      makeOverlay({
        id: "modal-1",
        activityId: "activity-b",
        openedAt: 10,
      }),
    );

    const state = controller.getState();
    expect(state.activityCount).toBe(2);
    expect(state.stepCount).toBe(1);
    expect(state.modalCount).toBe(1);
    expect(state.frames.map((frame) => frame.id)).toEqual([
      "activity-a",
      "activity-b",
      "step-1",
      "modal-1",
    ]);
  });

  it("setGroupLayers replaces group contents and removes missing layers", () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");

    controller.registerLayer(makeActivity({ id: "activity-1", isRoot: true }), {
      group: "home",
    });
    controller.registerLayer(makeOverlay({ id: "modal-1", openedAt: 5 }), {
      group: "home",
    });

    expect(controller.getState().frames).toHaveLength(2);

    controller.setGroupLayers("home", [
      makeActivity({ id: "activity-1", isRoot: true, zIndex: 5 }),
    ]);

    const state = controller.getState();
    expect(state.frames.map((frame) => frame.id)).toEqual(["activity-1"]);
    expect((state.frames[0] as ActivityLayer).zIndex).toBe(5);

    controller.setGroupLayers("home", []);
    expect(controller.getState().frames).toHaveLength(0);
  });

  it("pruneOrphanedOverlays removes non-persistent overlays without owners", () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");

    controller.registerLayer(
      makeOverlay({ id: "modal-a1", activityId: "a1", openedAt: 1 }),
    );
    controller.registerLayer(
      makeOverlay({ id: "modal-a2", activityId: "a2", openedAt: 2 }),
    );
    controller.registerLayer(
      makeOverlay({
        id: "modal-persist",
        activityId: "a3",
        persistAcrossActivities: true,
        openedAt: 3,
      }),
    );
    controller.registerLayer(
      makeOverlay({ id: "modal-global", activityId: undefined, openedAt: 4 }),
    );

    controller.pruneOrphanedOverlays(new Set(["a1"]));

    expect(controller.getState().frames.map((frame) => frame.id)).toEqual([
      "modal-a1",
      "modal-persist",
      "modal-global",
    ]);
  });

  it("popTopLayer pops the newest overlay and unregisters it", async () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");
    const overlayClose = vi.fn();

    controller.registerLayer(
      makeActivity({ id: "activity-1", isRoot: true, isTop: true }),
    );
    controller.registerLayer(
      makeOverlay({ id: "modal-old", openedAt: 1, onClose: vi.fn() }),
    );
    controller.registerLayer(
      makeOverlay({ id: "modal-new", openedAt: 5, onClose: overlayClose }),
    );

    const result = await controller.popTopLayer();

    expect(result).toEqual({ popped: "modal", targetId: "modal-new" });
    expect(overlayClose).toHaveBeenCalledTimes(1);
    expect(controller.getState().frames.map((frame) => frame.id)).toEqual([
      "activity-1",
      "modal-old",
    ]);
  });

  it("popTopLayer returns a step when no overlay exists", async () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");
    const stepClose = vi.fn();

    controller.registerLayer(
      makeActivity({ id: "activity-1", isRoot: false, isTop: true }),
    );
    controller.registerLayer(
      makeStep({
        id: "step-1",
        activityId: "activity-1",
        zIndex: 2,
        onClose: stepClose,
      }),
    );

    const result = await controller.popTopLayer();

    expect(result).toEqual({ popped: "step", targetId: "step-1" });
    expect(stepClose).toHaveBeenCalledTimes(1);
  });

  it("popTopLayer returns an activity when it is not root", async () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");
    const activityClose = vi.fn();

    controller.registerLayer(
      makeActivity({
        id: "activity-1",
        isRoot: false,
        isTop: true,
        onClose: activityClose,
      }),
    );

    const result = await controller.popTopLayer();

    expect(result).toEqual({ popped: "activity", targetId: "activity-1" });
    expect(activityClose).toHaveBeenCalledTimes(1);
  });

  it("popTopLayer returns exit when only root activity remains", async () => {
    const manager = new LayerManager({});
    const controller = manager.getController("root");

    controller.registerLayer(
      makeActivity({ id: "activity-1", isRoot: true, isTop: true }),
    );

    const result = await controller.popTopLayer();

    expect(result).toEqual({ popped: "exit" });
  });
});
