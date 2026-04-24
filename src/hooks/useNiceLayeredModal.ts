import NiceModal from "@ebay/nice-modal-react";
import { useActivity } from "@stackflow/react";
import { useCallback } from "react";

import { useOptionalStackScope, useStacks } from "../contexts/StackContext";
import { openLayeredModal } from "../lib/layeredModalBridge";
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
  let layerClose: (() => void) | null = null;

  const show = () => {
    void NiceModal.show(id, {
      ...(args ?? {}),
      keepMounted: true,
      onLayerClose: layerClose ?? undefined,
    });
  };

  return openLayeredModal<void>({
    id,
    label,
    activityId,
    stackName,
    persistAcrossActivities,
    openModal: ({ onClose }) => {
      layerClose = onClose;
      show();
    },
    onSuspend: () => {
      void NiceModal.hide(id);
    },
    onResume: () => {
      show();
    },
    onClose: () => {
      void NiceModal.hide(id).then(() => NiceModal.remove(id));
    },
  });
};

export const useNiceLayeredModal = () => {
  const activity = useActivity();
  const scope = useOptionalStackScope();
  const { activeStack } = useStacks();

  return useCallback(
    <TArgs extends NiceLayeredModalArgs = NiceLayeredModalArgs>(
      options: OpenNiceLayeredModalOptions<TArgs>
    ) =>
      openNiceLayeredModal({
        ...options,
        activityId: options.activityId ?? activity.id,
        stackName: options.stackName ?? scope?.stackName ?? activeStack,
      }),
    [activeStack, activity.id, scope?.stackName]
  );
};
