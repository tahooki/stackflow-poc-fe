import type { BackActionResult, LayerManager } from "./layerManager";
import type { StackManager } from "../stack/stackManager";

type BackManagerDeps = {
  layerManager: LayerManager;
  stackManager: StackManager;
};

export class BackManager {
  private layerManager: LayerManager;
  private stackManager: StackManager;

  constructor({ layerManager, stackManager }: BackManagerDeps) {
    this.layerManager = layerManager;
    this.stackManager = stackManager;
  }

  /**
   * Handles back across layers (modal/step/activity) and stacks.
   * - First delegates to the active stack's LayerController.
   * - If the active stack reaches its root (exit), it returns to the previous stack in history.
   */
  async handleBackPress(): Promise<BackActionResult> {
    const activeStack = this.stackManager.getStackSwitchState().activeStack;
    const result = await this.layerManager
      .getController(activeStack)
      .popTopLayer();

    if (result.popped !== "exit") {
      return result;
    }

    const poppedStack = this.stackManager.popStackHistory();
    if (poppedStack) {
      return { popped: "stack", targetId: poppedStack };
    }

    const resetStack = this.stackManager.resetToInitStack();
    if (resetStack) {
      return { popped: "stack", targetId: resetStack };
    }

    return result;
  }
}
