import type { Stack, StackflowActions } from "@stackflow/core";

export type LayerKind = "activity" | "step" | "modal";

export type ActivityLayer = {
  kind: "activity";
  id: string;
  name: string;
  zIndex: number;
  isTop: boolean;
  isRoot: boolean;
  isActive: boolean;
  params: Record<string, string | undefined>;
};

export type StepLayer = {
  kind: "step";
  id: string;
  activityId: string;
  hasZIndex?: boolean;
  zIndex: number;
};

export type ModalLayer = {
  kind: "modal";
  id: string;
  activityId?: string;
  label?: string;
  openedAt: number;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
};

export type LayerFrame = ActivityLayer | StepLayer | ModalLayer;

export type LayerState = {
  frames: LayerFrame[];
  activityCount: number;
  modalCount: number;
  stepCount: number;
  lastStackUpdateAt: number | null;
};

export type BackActionResult =
  | { popped: "modal"; targetId: string }
  | { popped: "step"; targetId: string }
  | { popped: "activity"; targetId: string }
  | { popped: "exit" }
  | { popped: "none" };

type ModalRegistration = Omit<ModalLayer, "kind" | "openedAt"> & {
  openedAt?: number;
};

type Listener = (state: LayerState) => void;

const emptyState: LayerState = {
  frames: [],
  activityCount: 0,
  modalCount: 0,
  stepCount: 0,
  lastStackUpdateAt: null,
};

const sortByOpenedAt = (left: ModalLayer, right: ModalLayer) =>
  left.openedAt - right.openedAt;

class LayerController {
  private actions: StackflowActions | null = null;
  private lastStack: Stack | null = null;
  private listeners = new Set<Listener>();
  private modalRegistry = new Map<string, ModalLayer>();
  private state: LayerState = emptyState;
  private handlingBack = false;

  attach(actions: StackflowActions) {
    this.actions = actions;
    console.log("[LayerController] attach actions");
    this.syncFromStack(actions.getStack());
  }

  syncFromStack(stack: Stack) {
    this.lastStack = stack;
    this.pruneOrphanedModals(stack);

    const frames: LayerFrame[] = [];
    let stepCount = 0;

    stack.activities.forEach((activity) => {
      frames.push({
        kind: "activity",
        id: activity.id,
        name: activity.name,
        params: activity.params,
        isTop: activity.isTop,
        isRoot: activity.isRoot,
        isActive: activity.isActive,
        zIndex: activity.zIndex,
      });

      activity.steps.forEach((step) => {
        frames.push({
          kind: "step",
          id: step.id,
          activityId: activity.id,
          hasZIndex: step.hasZIndex,
          zIndex: step.zIndex,
        });
        stepCount += 1;
      });
    });

    const modalFrames = Array.from(this.modalRegistry.values()).sort(
      sortByOpenedAt
    );
    frames.push(...modalFrames);

    this.state = {
      frames,
      activityCount: stack.activities.length,
      modalCount: modalFrames.length,
      stepCount,
      lastStackUpdateAt: Date.now(),
    };

    console.log(
      "[LayerController] syncFromStack",
      `activities=${stack.activities.length}`,
      `steps=${stepCount}`,
      `modals=${modalFrames.length}`
    );

    this.emit();
  }

  registerModalLayer(modal: ModalRegistration) {
    const openedAt =
      modal.openedAt ??
      this.modalRegistry.get(modal.id)?.openedAt ??
      Date.now();

    this.modalRegistry.set(modal.id, {
      ...modal,
      openedAt,
      kind: "modal",
    });

    console.log("[LayerController] registerModal", modal.id, {
      activityId: modal.activityId,
      persistAcrossActivities: modal.persistAcrossActivities,
    });

    if (this.lastStack) {
      this.syncFromStack(this.lastStack);
    }
  }

  unregisterModalLayer(modalId: string) {
    if (this.modalRegistry.has(modalId)) {
      this.modalRegistry.delete(modalId);
      console.log("[LayerController] unregisterModal", modalId);
      if (this.lastStack) {
        this.syncFromStack(this.lastStack);
      }
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  async handleBackPress(): Promise<BackActionResult> {
    if (this.handlingBack) {
      console.log("[LayerController] handleBackPress skipped (handling)");
      return { popped: "none" };
    }

    this.handlingBack = true;
    try {
      console.log("[LayerController] handleBackPress start");
      const actions = this.actions;
      const stack = actions?.getStack() ?? this.lastStack;
      const topActivity = this.getTopActivity(stack);

      const topModal = this.getTopModalForActivity(topActivity?.id);
      if (topModal) {
        console.log("[LayerController] popping modal", topModal.id, {
          modalActivityId: topModal.activityId,
          topActivityId: topActivity?.id,
        });
        this.unregisterModalLayer(topModal.id);
        topModal.onClose?.();
        const result: BackActionResult = {
          popped: "modal",
          targetId: topModal.id,
        };
        console.log("[LayerController] back result", result);
        return result;
      }

      if (!actions || !stack) {
        console.log("[LayerController] no actions/stack", {
          hasActions: Boolean(actions),
          hasStack: Boolean(stack),
        });
        return { popped: "none" };
      }

      if (!topActivity) {
        console.log("[LayerController] no activities, allow exit");
        const result: BackActionResult = { popped: "exit" };
        console.log("[LayerController] back result", result);
        return result;
      }

      console.log("[LayerController] topActivity", topActivity.id, {
        name: topActivity.name,
        isRoot: topActivity.isRoot,
        stepCount: topActivity.steps.length,
      });

      const stepCount = topActivity.steps.length;
      const topStep =
        stepCount > 1 ? topActivity.steps[topActivity.steps.length - 1] : null;
      if (topStep) {
        console.log("[LayerController] popping step", topStep.id, {
          stepCount,
        });
        actions.stepPop({
          targetActivityId: topActivity.id,
        });
        const result: BackActionResult = {
          popped: "step",
          targetId: topStep.id,
        };
        console.log("[LayerController] back result", result);
        return result;
      }

      if (!topActivity.isRoot) {
        console.log("[LayerController] popping activity", topActivity.id);
        actions.pop();
        const result: BackActionResult = {
          popped: "activity",
          targetId: topActivity.id,
        };
        console.log("[LayerController] back result", result);
        return result;
      }

      console.log("[LayerController] root reached, allow exit");
      const result: BackActionResult = { popped: "exit" };
      console.log("[LayerController] back result", result);
      return result;
    } finally {
      this.handlingBack = false;
    }
  }

  private getTopModalForActivity(activityId?: string) {
    const modals = Array.from(this.modalRegistry.values()).sort(sortByOpenedAt);

    for (let i = modals.length - 1; i >= 0; i -= 1) {
      const modal = modals[i];
      if (!activityId || !modal.activityId || modal.activityId === activityId) {
        return modal;
      }
    }

    return undefined;
  }

  private getTopActivity(stack: Stack | null) {
    if (!stack) {
      return undefined;
    }

    const flaggedTop = stack.activities.find((activity) => activity.isTop);
    if (flaggedTop) {
      return flaggedTop;
    }

    // Fallback: pick the highest z-index activity that hasn't exited.
    const visible = stack.activities.filter((activity) => !activity.exitedBy);
    if (visible.length === 0) {
      return undefined;
    }

    return visible.reduce((current, candidate) =>
      candidate.zIndex >= current.zIndex ? candidate : current
    );
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private pruneOrphanedModals(stack: Stack) {
    const activeActivityIds = new Set(
      stack.activities.map((activity) => activity.id)
    );

    for (const [modalId, modal] of Array.from(this.modalRegistry.entries())) {
      const hasOwner = modal.activityId
        ? activeActivityIds.has(modal.activityId)
        : true;

      if (!hasOwner && !modal.persistAcrossActivities) {
        this.modalRegistry.delete(modalId);
      }
    }
  }
}

export const layerController = new LayerController();
