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

    this.emit();
  }

  registerModalLayer(modal: ModalRegistration) {
    const openedAt =
      modal.openedAt ?? this.modalRegistry.get(modal.id)?.openedAt ?? Date.now();

    this.modalRegistry.set(modal.id, {
      ...modal,
      openedAt,
      kind: "modal",
    });

    if (this.lastStack) {
      this.syncFromStack(this.lastStack);
    }
  }

  unregisterModalLayer(modalId: string) {
    if (this.modalRegistry.has(modalId)) {
      this.modalRegistry.delete(modalId);
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

  async handleBackPress(
    confirmExit?: () => boolean | Promise<boolean>
  ): Promise<BackActionResult> {
    if (this.handlingBack) {
      return { popped: "none" };
    }

    this.handlingBack = true;
    try {
      const topModal = this.getTopModal();
      if (topModal) {
        this.unregisterModalLayer(topModal.id);
        topModal.onClose?.();
        return { popped: "modal", targetId: topModal.id };
      }

      const actions = this.actions;
      const stack = actions?.getStack() ?? this.lastStack;

      if (!actions || !stack) {
        return { popped: "none" };
      }

      const topActivity = stack.activities[stack.activities.length - 1];
      if (!topActivity) {
        return { popped: "exit" };
      }

      const topStep = topActivity.steps[topActivity.steps.length - 1];
      if (topStep) {
        actions.stepPop({
          targetActivityId: topActivity.id,
        });
        return { popped: "step", targetId: topStep.id };
      }

      if (!topActivity.isRoot) {
        actions.pop();
        return { popped: "activity", targetId: topActivity.id };
      }

      const shouldExit = confirmExit ? await confirmExit() : false;
      return shouldExit ? { popped: "exit" } : { popped: "none" };
    } finally {
      this.handlingBack = false;
    }
  }

  private getTopModal() {
    const modals = Array.from(this.modalRegistry.values()).sort(sortByOpenedAt);
    return modals[modals.length - 1];
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private pruneOrphanedModals(stack: Stack) {
    const activeActivityIds = new Set(stack.activities.map((activity) => activity.id));

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
