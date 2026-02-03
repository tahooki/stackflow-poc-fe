import { describe, expect, it, vi } from "vitest";

import { BackManager } from "../../lib/backManager";
import { LayerManager } from "../../lib/layerManager";
import type { StackManager } from "../../stack/stackManager";
import type { StackName } from "../../stack/stackConfig";

const createStackManagerStub = (activeStack: StackName) => ({
  getStackSwitchState: vi.fn(() => ({
    activeStack,
    stackHistory: [],
    lastStackUpdateAt: null,
  })),
  popStackHistory: vi.fn(() => null),
  resetToInitStack: vi.fn(() => null),
});

describe("BackManager", () => {
  it("returns layer result when active stack handles back", async () => {
    const layerManager = new LayerManager({});
    const getControllerSpy = vi.spyOn(layerManager, "getController");
    const controller = layerManager.getController("orders");
    const popSpy = vi
      .spyOn(controller, "popTopLayer")
      .mockResolvedValue({ popped: "modal", targetId: "modal-1" });

    const stackManager = createStackManagerStub("orders");
    const backManager = new BackManager({
      layerManager,
      stackManager: stackManager as unknown as StackManager,
    });

    const result = await backManager.handleBackPress();

    expect(result).toEqual({ popped: "modal", targetId: "modal-1" });
    expect(getControllerSpy).toHaveBeenCalledWith("orders");
    expect(popSpy).toHaveBeenCalledTimes(1);
    expect(stackManager.popStackHistory).not.toHaveBeenCalled();
    expect(stackManager.resetToInitStack).not.toHaveBeenCalled();
  });

  it("pops stack history when layer stack exits", async () => {
    const layerManager = new LayerManager({});
    const controller = layerManager.getController("home");
    vi.spyOn(controller, "popTopLayer").mockResolvedValue({ popped: "exit" });

    const stackManager = createStackManagerStub("home");
    stackManager.popStackHistory.mockReturnValue("orders");

    const backManager = new BackManager({
      layerManager,
      stackManager: stackManager as unknown as StackManager,
    });

    const result = await backManager.handleBackPress();

    expect(result).toEqual({ popped: "stack", targetId: "orders" });
    expect(stackManager.popStackHistory).toHaveBeenCalledTimes(1);
    expect(stackManager.resetToInitStack).not.toHaveBeenCalled();
  });

  it("resets to init stack when history is empty", async () => {
    const layerManager = new LayerManager({});
    const controller = layerManager.getController("home");
    vi.spyOn(controller, "popTopLayer").mockResolvedValue({ popped: "exit" });

    const stackManager = createStackManagerStub("home");
    stackManager.resetToInitStack.mockReturnValue("home");

    const backManager = new BackManager({
      layerManager,
      stackManager: stackManager as unknown as StackManager,
    });

    const result = await backManager.handleBackPress();

    expect(result).toEqual({ popped: "stack", targetId: "home" });
    expect(stackManager.popStackHistory).toHaveBeenCalledTimes(1);
    expect(stackManager.resetToInitStack).toHaveBeenCalledTimes(1);
  });

  it("returns exit when no stack history or reset is available", async () => {
    const layerManager = new LayerManager({});
    const controller = layerManager.getController("home");
    vi.spyOn(controller, "popTopLayer").mockResolvedValue({ popped: "exit" });

    const stackManager = createStackManagerStub("home");

    const backManager = new BackManager({
      layerManager,
      stackManager: stackManager as unknown as StackManager,
    });

    const result = await backManager.handleBackPress();

    expect(result).toEqual({ popped: "exit" });
    expect(stackManager.popStackHistory).toHaveBeenCalledTimes(1);
    expect(stackManager.resetToInitStack).toHaveBeenCalledTimes(1);
  });
});
