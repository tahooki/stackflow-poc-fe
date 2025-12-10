import { useEffect } from "react";
import { useActivity } from "@stackflow/react";

import { layerController as layerManager } from "../lib/layerManager";

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
      layerManager.registerModalLayer({
        id: modalId,
        activityId: activity.id,
        label,
        persistAcrossActivities,
        onClose,
      });

      return () => {
        layerManager.unregisterModalLayer(modalId);
      };
    }

    layerManager.unregisterModalLayer(modalId);
    return undefined;
  }, [activity.id, isOpen, label, modalId, onClose, persistAcrossActivities]);
};
