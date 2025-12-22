import { useEffect, useRef, useSyncExternalStore } from "react";
import { useActivity } from "@stackflow/react";

import { Cfg } from "../config/Cfg";
import type { OverlayKind } from "../lib/layerManager";
import type { StackName } from "../stack/stackConfig";

export type UseLayerOptions = {
  id?: string;
  label?: string;
  isOpen: boolean;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
  kind?: OverlayKind;
  stackName?: StackName;
};

export const useLayer = ({
  id: explicitId,
  label,
  isOpen,
  persistAcrossActivities,
  onClose,
  kind = "modal",
  stackName,
}: UseLayerOptions) => {
  const activity = useActivity();
  const stackManager = Cfg.getStack();
  const activeStack = useSyncExternalStore(
    stackManager.subscribeStackSwitch.bind(stackManager),
    () => stackManager.getStackSwitchState().activeStack,
    () => stackManager.getStackSwitchState().activeStack
  );
  const controller = Cfg.getLayer().getController(stackName ?? activeStack);
  const layerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const layerId = explicitId ?? layerIdRef.current;
      if (layerId) {
        controller.unregisterLayer(layerId);
      }
      return undefined;
    }

    const layerId = controller.registerLayer({
      kind,
      id: explicitId ?? layerIdRef.current ?? undefined,
      activityId: activity.id,
      label,
      persistAcrossActivities,
      onClose,
    });

    layerIdRef.current = layerId;

    return () => {
      controller.unregisterLayer(layerId);
    };
  }, [
    activity.id,
    controller,
    explicitId,
    isOpen,
    kind,
    label,
    onClose,
    persistAcrossActivities,
  ]);
};
