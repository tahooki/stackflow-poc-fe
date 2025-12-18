import { useEffect } from "react";
import { useActivity } from "@stackflow/react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import { getLayerController } from "../lib/layerManager";

export type UseModalLayerOptions = {
  id?: string;
  label?: string;
  isOpen: boolean;
  persistAcrossActivities?: boolean;
  onClose?: () => void;
};

export const useModalLayer = ({
  id: explicitId,
  label,
  isOpen,
  persistAcrossActivities,
  onClose,
}: UseModalLayerOptions) => {
  const activity = useActivity();
  const { activeStack } = useStacks();
  const scope = useOptionalStackScope();
  const modalId = explicitId ?? `${activity.id}-modal`;
  const controller = getLayerController(scope?.stackName ?? activeStack);

  useEffect(() => {
    if (isOpen) {
      controller.registerModalLayer({
        id: modalId,
        activityId: activity.id,
        label,
        persistAcrossActivities,
        onClose,
      });

      return () => {
        controller.unregisterModalLayer(modalId);
      };
    }

    controller.unregisterModalLayer(modalId);
    return undefined;
  }, [
    activity.id,
    controller,
    isOpen,
    label,
    modalId,
    onClose,
    persistAcrossActivities,
  ]);
};
