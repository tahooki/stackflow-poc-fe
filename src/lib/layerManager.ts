export type LayerManagerConfig = Record<string, never>;

export type LayerKind = "activity" | "step" | "modal" | "drawer" | "actionSheet";
export type OverlayKind = Exclude<LayerKind, "activity" | "step">;

export type ActivityLayer = {
  kind: "activity";
  id: string;
  name: string;
  zIndex: number;
  isTop: boolean;
  isRoot: boolean;
  isActive: boolean;
  params: Record<string, string | undefined>;
  exitedBy?: string | null;
  order?: number;
  onClose?: () => void;
};

export type StepLayer = {
  kind: "step";
  id: string;
  activityId: string;
  hasZIndex?: boolean;
  zIndex: number;
  order?: number;
  onClose?: () => void;
};

export type OverlayLayer = {
  kind: OverlayKind;
  id: string;
  activityId?: string;
  label?: string;
  openedAt: number;
  persistAcrossActivities?: boolean;
  order?: number;
  onClose?: () => void;
};

export type LayerFrame = ActivityLayer | StepLayer | OverlayLayer;

export type LayerState = {
  frames: LayerFrame[];
  activityCount: number;
  modalCount: number;
  stepCount: number;
  lastStackUpdateAt: number | null;
};

export type BackActionResult =
  | { popped: "modal"; targetId: string }
  | { popped: "drawer"; targetId: string }
  | { popped: "actionSheet"; targetId: string }
  | { popped: "step"; targetId: string }
  | { popped: "activity"; targetId: string }
  | { popped: "stack"; targetId: string }
  | { popped: "exit" }
  | { popped: "none" };

type OverlayRegistration = Omit<OverlayLayer, "openedAt"> & {
  openedAt?: number;
};

export type LayerRegistration = ActivityLayer | StepLayer | OverlayRegistration;

type Listener = (state: LayerState) => void;

const overlayKinds = new Set<LayerKind>(["modal", "drawer", "actionSheet"]);
const overlayOrderBase = 1_000_000_000_000;

const emptyState: LayerState = {
  frames: [],
  activityCount: 0,
  modalCount: 0,
  stepCount: 0,
  lastStackUpdateAt: null,
};

const isOverlayKind = (kind: LayerKind): kind is OverlayKind =>
  overlayKinds.has(kind);

const isOverlayLayer = (
  layer: LayerFrame | LayerRegistration
): layer is OverlayLayer | OverlayRegistration => isOverlayKind(layer.kind);

const getLayerOrder = (layer: LayerFrame) => {
  const base = isOverlayKind(layer.kind) ? overlayOrderBase : 0;

  if (typeof layer.order === "number") {
    return base + layer.order;
  }

  if (isOverlayLayer(layer)) {
    return base + (layer.openedAt ?? 0);
  }

  return base + layer.zIndex;
};

class LayerController {
  private layers = new Map<string, LayerFrame>();
  private groups = new Map<string, Set<string>>();
  private listeners = new Set<Listener>();
  private state: LayerState = emptyState;
  private handlingBack = false;

  registerLayer(layer: LayerRegistration, options?: { group?: string }) {
    const normalized = this.normalizeLayer(layer);
    this.layers.set(normalized.id, normalized);
    this.assignGroup(normalized.id, options?.group);
    console.log("[LayerController] registerLayer", {
      kind: normalized.kind,
      id: normalized.id,
      activityId: "activityId" in normalized ? normalized.activityId : undefined,
      group: options?.group ?? null,
    });
    this.refreshState();
  }

  setGroupLayers(group: string, layers: LayerRegistration[]) {
    const summary = layers.reduce(
      (acc, layer) => {
        acc.total += 1;
        acc[layer.kind] = (acc[layer.kind] ?? 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
    console.log("[LayerController] setGroupLayers", {
      group,
      total: summary.total,
      activity: summary.activity ?? 0,
      step: summary.step ?? 0,
      modal: summary.modal ?? 0,
      drawer: summary.drawer ?? 0,
      actionSheet: summary.actionSheet ?? 0,
    });
    const nextIds = new Set(layers.map((layer) => layer.id));
    const existingIds = this.groups.get(group);

    if (existingIds) {
      for (const id of existingIds) {
        if (!nextIds.has(id)) {
          this.layers.delete(id);
          this.removeFromGroups(id);
        }
      }
    }

    const nextGroup = new Set<string>();
    layers.forEach((layer) => {
      const normalized = this.normalizeLayer(layer);
      this.layers.set(normalized.id, normalized);
      this.removeFromGroups(normalized.id);
      nextGroup.add(normalized.id);
    });

    if (nextGroup.size > 0) {
      this.groups.set(group, nextGroup);
    } else {
      this.groups.delete(group);
    }

    this.refreshState();
  }

  unregisterLayer(layerId: string) {
    if (this.layers.delete(layerId)) {
      this.removeFromGroups(layerId);
      console.log("[LayerController] unregisterLayer", { id: layerId });
      this.refreshState();
    }
  }

  pruneOrphanedOverlays(activeActivityIds: Set<string>) {
    let mutated = false;

    for (const [layerId, layer] of Array.from(this.layers.entries())) {
      if (!isOverlayLayer(layer)) {
        continue;
      }

      const hasOwner = layer.activityId
        ? activeActivityIds.has(layer.activityId)
        : true;

      if (!hasOwner && !layer.persistAcrossActivities) {
        this.layers.delete(layerId);
        this.removeFromGroups(layerId);
        mutated = true;
      }
    }

    if (mutated) {
      this.refreshState();
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

  async popTopLayer(): Promise<BackActionResult> {
    if (this.handlingBack) {
      console.log("[LayerController] popTopLayer skipped (handling)");
      return { popped: "none" };
    }

    this.handlingBack = true;
    try {
      console.log("[LayerController] popTopLayer start");
      const topActivity = this.getTopActivity();
      const topOverlay = this.getTopOverlayForActivity(topActivity?.id);

      if (topOverlay) {
        console.log("[LayerController] popping overlay", topOverlay.id, {
          kind: topOverlay.kind,
          modalActivityId: topOverlay.activityId,
          topActivityId: topActivity?.id,
        });
        this.unregisterLayer(topOverlay.id);
        topOverlay.onClose?.();
        const result: BackActionResult = {
          popped: topOverlay.kind,
          targetId: topOverlay.id,
        };
        console.log("[LayerController] back result", result);
        return result;
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
      });

      const topStep = this.getTopStepForActivity(topActivity.id);
      if (topStep) {
        console.log("[LayerController] popping step", topStep.id);
        topStep.onClose?.();
        const result: BackActionResult = {
          popped: "step",
          targetId: topStep.id,
        };
        console.log("[LayerController] back result", result);
        return result;
      }

      if (!topActivity.isRoot) {
        console.log("[LayerController] popping activity", topActivity.id);
        topActivity.onClose?.();
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

  private refreshState() {
    const frames = Array.from(this.layers.values()).sort(
      (left, right) => getLayerOrder(left) - getLayerOrder(right)
    );
    this.state = {
      frames,
      activityCount: frames.filter((frame) => frame.kind === "activity").length,
      modalCount: frames.filter((frame) => isOverlayKind(frame.kind)).length,
      stepCount: frames.filter((frame) => frame.kind === "step").length,
      lastStackUpdateAt: Date.now(),
    };
    console.log("[LayerController] refreshState", {
      total: frames.length,
      activity: this.state.activityCount,
      step: this.state.stepCount,
      modal: this.state.modalCount,
    });
    this.emit();
  }

  private normalizeLayer(layer: LayerRegistration): LayerFrame {
    if (!isOverlayLayer(layer)) {
      return layer;
    }

    const existing = this.layers.get(layer.id);
    const openedAt =
      layer.openedAt ??
      (existing && isOverlayLayer(existing) ? existing.openedAt : undefined) ??
      Date.now();

    return {
      ...layer,
      openedAt,
    };
  }

  private getTopOverlayForActivity(activityId?: string) {
    let topOverlay: OverlayLayer | undefined;

    for (const layer of this.layers.values()) {
      if (!isOverlayLayer(layer)) {
        continue;
      }

      if (activityId && layer.activityId && layer.activityId !== activityId) {
        continue;
      }

      if (!topOverlay || layer.openedAt >= topOverlay.openedAt) {
        topOverlay = layer;
      }
    }

    return topOverlay;
  }

  private getTopActivity() {
    const activities = Array.from(this.layers.values()).filter(
      (layer): layer is ActivityLayer => layer.kind === "activity"
    );

    const flaggedTop = activities.find((activity) => activity.isTop);
    if (flaggedTop) {
      return flaggedTop;
    }

    const visible = activities.filter((activity) => !activity.exitedBy);
    if (visible.length === 0) {
      return undefined;
    }

    return visible.reduce((current, candidate) =>
      candidate.zIndex >= current.zIndex ? candidate : current
    );
  }

  private getTopStepForActivity(activityId: string) {
    const steps = Array.from(this.layers.values()).filter(
      (layer): layer is StepLayer =>
        layer.kind === "step" && layer.activityId === activityId
    );

    if (steps.length === 0) {
      return undefined;
    }

    return steps.reduce((current, candidate) =>
      candidate.zIndex >= current.zIndex ? candidate : current
    );
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private assignGroup(layerId: string, group?: string) {
    this.removeFromGroups(layerId);
    if (!group) {
      return;
    }

    let ids = this.groups.get(group);
    if (!ids) {
      ids = new Set<string>();
      this.groups.set(group, ids);
    }
    ids.add(layerId);
  }

  private removeFromGroups(layerId: string) {
    for (const [group, ids] of this.groups.entries()) {
      if (ids.delete(layerId) && ids.size === 0) {
        this.groups.delete(group);
      }
    }
  }
}

export class LayerManager {
  private controllers = new Map<string, LayerController>();
  private config: LayerManagerConfig;

  constructor(config: LayerManagerConfig) {
    this.config = config;
  }

  getConfig() {
    return this.config;
  }

  getController(stackName: string) {
    const existing = this.controllers.get(stackName);
    if (existing) {
      return existing;
    }

    const next = new LayerController();
    this.controllers.set(stackName, next);
    return next;
  }
}
