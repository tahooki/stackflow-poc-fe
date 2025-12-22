import { useEffect, useRef } from "react";
import { useActivity } from "@stackflow/react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import { Cfg } from "../config/Cfg";
import type { OverlayKind } from "../lib/layerManager";

export type UseLayerOptions = {
  id?: string;
  label?: string;
  isOpen: boolean;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
  kind?: OverlayKind;
};

export const useLayer = ({
  id: explicitId,
  label,
  isOpen,
  persistAcrossActivities,
  onClose,
  kind = "modal",
}: UseLayerOptions) => {
  const activity = useActivity();
  const { activeStack } = useStacks();
  const scope = useOptionalStackScope();
  const controller = Cfg.getLayer().getController(scope?.stackName ?? activeStack);
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
