import { useEffect, useRef, useSyncExternalStore } from "react";
import { useActivity } from "@stackflow/react";

import { Cfg } from "../config/Cfg";
import { useOptionalStackScope } from "../contexts/StackContext";
import type { OverlayKind } from "../lib/layerManager";
import type { StackName } from "../stack/stackConfig";

export type UseLayerOptions = {
  id?: string;
  activityId?: string;
  label?: string;
  isOpen: boolean;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
  onSuspend?: () => void;
  onResume?: () => void;
  kind?: OverlayKind;
  stackName?: StackName;
};

export const useLayer = ({
  id: explicitId,
  activityId: explicitActivityId,
  label,
  isOpen,
  persistAcrossActivities,
  onClose,
  onSuspend,
  onResume,
  kind = "modal",
  stackName,
}: UseLayerOptions) => {
  const activity = useActivity() as ReturnType<typeof useActivity> | null;
  const scope = useOptionalStackScope();
  const stackManager = Cfg.getStack();
  const activeStack = useSyncExternalStore(
    stackManager.subscribeStackSwitch.bind(stackManager),
    () => stackManager.getStackSwitchState().activeStack,
    () => stackManager.getStackSwitchState().activeStack
  );
  const controller = Cfg.getLayer().getController(
    stackName ?? scope?.stackName ?? activeStack
  );
  const layerIdRef = useRef<string | null>(null);
  const ownerActivityId =
    explicitActivityId ?? activity?.id ?? controller.getTopActivityLayer()?.id;

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
      activityId: ownerActivityId,
      label,
      persistAcrossActivities,
      onClose,
      onSuspend,
      onResume,
    });

    layerIdRef.current = layerId;

    return () => {
      controller.unregisterLayer(layerId);
    };
  }, [
    controller,
    explicitId,
    explicitActivityId,
    isOpen,
    kind,
    label,
    onClose,
    onResume,
    onSuspend,
    ownerActivityId,
    persistAcrossActivities,
  ]);
};
