import { useEffect } from "react";
import { useActivity } from "@stackflow/react";

import { layerController } from "../lib/layerController";

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
  const modalId = explicitId ?? `${activity.id}-modal`;

  useEffect(() => {
    if (isOpen) {
      layerController.registerModalLayer({
        id: modalId,
        activityId: activity.id,
        label,
        persistAcrossActivities,
        onClose,
      });

      return () => {
        layerController.unregisterModalLayer(modalId);
      };
    }

    layerController.unregisterModalLayer(modalId);
    return undefined;
  }, [
    activity.id,
    isOpen,
    label,
    modalId,
    onClose,
    persistAcrossActivities,
  ]);
};
