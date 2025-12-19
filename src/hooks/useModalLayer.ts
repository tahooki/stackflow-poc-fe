import { useEffect } from "react";
import { useActivity } from "@stackflow/react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import { Cfg } from "../config/Cfg";
import type { OverlayKind } from "../lib/layerManager";

export type UseModalLayerOptions = {
  id?: string;
  label?: string;
  isOpen: boolean;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
  kind?: OverlayKind;
};

export const useModalLayer = ({
  id: explicitId,
  label,
  isOpen,
  persistAcrossActivities,
  onClose,
  kind = "modal",
}: UseModalLayerOptions) => {
  const activity = useActivity();
  const { activeStack } = useStacks();
  const scope = useOptionalStackScope();
  const modalId = explicitId ?? `${activity.id}-modal`;
  const controller = Cfg.getLayer().getController(scope?.stackName ?? activeStack);

  useEffect(() => {
    if (isOpen) {
      controller.registerLayer({
        kind,
        id: modalId,
        activityId: activity.id,
        label,
        persistAcrossActivities,
        onClose,
      });

      return () => {
        controller.unregisterLayer(modalId);
      };
    }

    controller.unregisterLayer(modalId);
    return undefined;
  }, [
    activity.id,
    controller,
    isOpen,
    kind,
    label,
    modalId,
    onClose,
    persistAcrossActivities,
  ]);
};
