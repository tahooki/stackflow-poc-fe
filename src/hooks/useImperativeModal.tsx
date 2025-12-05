import { useCallback, useMemo, useState, type ReactNode } from "react";
import Modal from "react-modal";

import { useModalLayer } from "./useModalLayer";

type ImperativeModalRender = (ctx: { close: () => void }) => ReactNode;

type ImperativeModalPayload = {
  label?: string;
  render: ImperativeModalRender;
  onAfterClose?: () => void;
};

export type UseImperativeModalOptions = {
  id?: string;
  overlayClassName?: string;
  contentClassName?: string;
  bodyOpenClassName?: string;
  persistAcrossActivities?: boolean;
};

export const useImperativeModal = ({
  id = "imperative-modal",
  overlayClassName,
  contentClassName,
  bodyOpenClassName,
  persistAcrossActivities,
}: UseImperativeModalOptions = {}) => {
  const [payload, setPayload] = useState<ImperativeModalPayload | null>(null);
  const isOpen = Boolean(payload);

  const close = useCallback(() => {
    setPayload((current) => {
      current?.onAfterClose?.();
      return null;
    });
  }, []);

  const open = useCallback((next: ImperativeModalPayload) => {
    setPayload(next);
  }, []);

  useModalLayer({
    id,
    isOpen,
    label: payload?.label,
    persistAcrossActivities,
    onClose: close,
  });

  const ModalPortal = useMemo(() => {
    const Portal = () =>
      payload ? (
        <Modal
          isOpen={isOpen}
          onRequestClose={close}
          overlayClassName={overlayClassName}
          className={contentClassName}
          bodyOpenClassName={bodyOpenClassName}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          shouldFocusAfterRender
          contentLabel={payload.label ?? "Modal"}
        >
          {payload.render({ close })}
        </Modal>
      ) : null;

    Portal.displayName = "ImperativeModalPortal";
    return Portal;
  }, [
    bodyOpenClassName,
    close,
    contentClassName,
    isOpen,
    overlayClassName,
    payload,
  ]);

  return { open, close, ModalPortal };
};
