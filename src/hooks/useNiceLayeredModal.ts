import NiceModal from "@ebay/nice-modal-react";
import { useActivity } from "@stackflow/react";
import { useCallback } from "react";

import { Cfg } from "../config/Cfg";
import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import type { StackName } from "../stack/stackConfig";

export type NiceLayeredModalInjectedProps = {
  keepMounted?: boolean;
  onLayerClose?: () => void;
};

type NiceLayeredModalArgs = Record<string, unknown>;

export type OpenNiceLayeredModalOptions<
  TArgs extends NiceLayeredModalArgs = NiceLayeredModalArgs,
> = {
  id: string;
  label?: string;
  args?: TArgs;
  activityId?: string;
  stackName?: StackName;
  persistAcrossActivities?: boolean;
};

export const openNiceLayeredModal = <
  TArgs extends NiceLayeredModalArgs = NiceLayeredModalArgs,
>({
  id,
  label,
  args,
  activityId,
  stackName,
  persistAcrossActivities,
}: OpenNiceLayeredModalOptions<TArgs>) => {
  const resolvedStackName =
    stackName ?? Cfg.getStack().getStackSwitchState().activeStack;
  const controller = Cfg.getLayer().getController(resolvedStackName);
  const ownerActivityId = activityId ?? controller.getTopActivityLayer()?.id;
  let layerId: string | null = null;

  const show = () => {
    void NiceModal.show(id, {
      ...(args ?? {}),
      keepMounted: true,
      onLayerClose: close,
    });
  };

  const close = () => {
    if (layerId) {
      controller.unregisterLayer(layerId);
      layerId = null;
    }

    void NiceModal.hide(id).then(() => NiceModal.remove(id));
  };

  layerId = controller.registerLayer({
    kind: "modal",
    id,
    activityId: ownerActivityId,
    label,
    persistAcrossActivities,
    onClose: close,
    onSuspend: () => {
      void NiceModal.hide(id);
    },
    onResume: () => {
      show();
    },
  });

  show();

  return {
    close,
    layerId,
  };
};

export const useNiceLayeredModal = () => {
  const activity = useActivity() as ReturnType<typeof useActivity> | null;
  const scope = useOptionalStackScope();
  const { activeStack } = useStacks();

  return useCallback(
    <TArgs extends NiceLayeredModalArgs = NiceLayeredModalArgs>(
      options: OpenNiceLayeredModalOptions<TArgs>
    ) =>
      openNiceLayeredModal({
        ...options,
        activityId: options.activityId ?? activity?.id,
        stackName: options.stackName ?? scope?.stackName ?? activeStack,
      }),
    [activeStack, activity?.id, scope?.stackName]
  );
};
