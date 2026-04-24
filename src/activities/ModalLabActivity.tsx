import { AppScreen } from "@stackflow/plugin-basic-ui";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import type { ActivityComponentType } from "@stackflow/react";
import Modal from "react-modal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import "../assets/modalLab.css";
import { useStackActions } from "../hooks/useStackActions";
import { useLayer } from "../hooks/useLayer";
import {
  type NiceLayeredModalInjectedProps,
  useNiceLayeredModal,
} from "../hooks/useNiceLayeredModal";

type ModalTemplate = {
  title: string;
  description: string;
  accent: string;
  bullets: string[];
};

const templates: ModalTemplate[] = [
  {
    title: "Full-screen status board",
    description:
      "Use this when you need to pin controls and freeze the background stack.",
    accent: "#38bdf8",
    bullets: [
      "Locks scroll behind the overlay",
      "Keeps focus inside until closed",
      "Perfect for interruption flows",
    ],
  },
  {
    title: "Snapshot handoff",
    description:
      "Kick off a Stackflow push directly from the modal footer after review.",
    accent: "#c084fc",
    bullets: [
      "Great for approvals",
      "Pair with CLEAR_TOP for reuse",
      "Keeps params scoped to the stack",
    ],
  },
  {
    title: "Ambient coach mark",
    description:
      "Show layered guidance without navigating away from the current activity.",
    accent: "#fbbf24",
    bullets: [
      "Overlay matches viewport height",
      "Dismiss or continue navigating",
      "Good for onboarding bursts",
    ],
  },
];

const MODAL_LAB_NICE_MODAL_ID = "modal-lab-overlay";
const PORTAL_LAYER_MODAL_ID = "modal-lab-portal-layer";

type ModalLabNiceModalProps = NiceLayeredModalInjectedProps & {
  template: ModalTemplate;
  onPushDetail: () => void;
};

const ModalLabNiceModal = NiceModal.create<ModalLabNiceModalProps>(
  ({ template, onLayerClose, onPushDetail, keepMounted }) => {
    const modal = useModal();
    const closeLayer = onLayerClose ?? (() => void modal.hide());

    useEffect(() => {
      Modal.setAppElement("#root");
    }, []);

    return (
      <Modal
        isOpen={modal.visible}
        onRequestClose={closeLayer}
        overlayClassName="modal-lab__overlay"
        className="modal-lab__content"
        bodyOpenClassName="modal-lab__body-open"
        shouldCloseOnOverlayClick
        shouldCloseOnEsc
        shouldFocusAfterRender
        contentLabel={template.title}
        onAfterClose={() => {
          modal.resolveHide();
          if (!keepMounted) {
            modal.remove();
          }
        }}
      >
        <div
          className="modal-lab__pill"
          style={{ backgroundColor: template.accent }}
        >
          Live overlay
        </div>
        <h2>{template.title}</h2>
        <p className="modal-lab__description">{template.description}</p>
        <ul className="modal-lab__list">
          {template.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="modal-lab__footer">
          <div className="modal-lab__meta">
            <span>Nice Modal</span>
            <span>react-modal view</span>
            <span>Layer-managed back</span>
          </div>
          <div className="modal-lab__controls">
            <button
              type="button"
              className="modal-lab__ghost"
              onClick={closeLayer}
            >
              Close
            </button>
            <button type="button" onClick={onPushDetail}>
              Push Detail
            </button>
          </div>
        </div>
      </Modal>
    );
  }
);

NiceModal.register(MODAL_LAB_NICE_MODAL_ID, ModalLabNiceModal);

type PortalLayerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPushDetail: () => void;
};

const PortalLayerModal = ({
  isOpen,
  onClose,
  onPushDetail,
}: PortalLayerModalProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useLayer({
    id: PORTAL_LAYER_MODAL_ID,
    isOpen,
    label: "createPortal + useLayer demo",
    onClose,
    onSuspend: () => setIsVisible(false),
    onResume: () => setIsVisible(true),
  });

  if (!isOpen || !isVisible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="modal-lab__overlay modal-lab__overlay--portal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-lab__content modal-lab__content--portal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-layer-title"
      >
        <div className="modal-lab__pill modal-lab__pill--portal">
          Portal layer
        </div>
        <h2 id="portal-layer-title">createPortal + useLayer</h2>
        <p className="modal-lab__description">
          This modal is rendered directly into document.body and registers its
          layer without using Nice Modal.
        </p>
        <ul className="modal-lab__list">
          <li>useActivity can be unavailable outside the activity tree.</li>
          <li>useLayer falls back to LayerManager's current top activity.</li>
          <li>Push Detail hides this portal until the owner activity is top.</li>
        </ul>
        <div className="modal-lab__footer">
          <div className="modal-lab__meta">
            <span>createPortal</span>
            <span>useLayer</span>
            <span>top activity fallback</span>
          </div>
          <div className="modal-lab__controls">
            <button
              type="button"
              className="modal-lab__ghost"
              onClick={onClose}
            >
              Close
            </button>
            <button type="button" onClick={onPushDetail}>
              Push Detail
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ModalLabActivity: ActivityComponentType = () => {
  const { push } = useStackActions();
  const openNiceModal = useNiceLayeredModal();
  const [isPortalLayerOpen, setIsPortalLayerOpen] = useState(false);

  const pushPortalDetail = useCallback(() => {
    push("detail", {
      params: {
        id: "portal-layer-hop",
        title: "Opened from createPortal + useLayer demo",
      },
    });
  }, [push]);

  const openModal = useCallback(
    (template: ModalTemplate) => {
      openNiceModal({
        id: MODAL_LAB_NICE_MODAL_ID,
        label: template.title,
        args: {
          template,
          onPushDetail: () =>
            push("detail", {
              params: {
                id: "modal-hop",
                title: "Opened from Nice Modal demo",
              },
            }),
        },
      });
    },
    [openNiceModal, push]
  );

  const templateButtons = useMemo(
    () =>
      templates.map((template) => (
        <button
          key={template.title}
          type="button"
          onClick={() => openModal(template)}
        >
          NiceModal.show(): {template.title}
        </button>
      )),
    [openModal]
  );

  const snippet = `// App root
<NiceModal.Provider>
  <App />
</NiceModal.Provider>

// Activity
const openModal = useNiceLayeredModal();

openModal({
  id: 'delete-confirm',
  label: 'Delete confirm',
  args: { itemId },
});

// NiceModal component
const modal = useModal();
<Modal
  open={modal.visible}
  onCancel={props.onLayerClose}
  afterClose={() => {
    modal.resolveHide();
    if (!props.keepMounted) modal.remove();
  }}
/>`;

  return (
    <AppScreen appBar={{ title: "Modal Lab" }}>
      <div className="activity modal-lab">
        <section className="activity__header">
          <h1>Nice Modal sandbox</h1>
          <p>
            Route Nice Modal through LayerManager so modals suspend under pushed
            activities and resume on back.
          </p>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>Launch a full modal</h2>
            <p>
              Each call wires to the same overlay, swapping content while the
              background stack stays intact.
            </p>
            <div className="modal-lab__actions">{templateButtons}</div>
          </section>

          <section className="activity__card">
            <h2>Launch a portal layer</h2>
            <p>
              Render a full-screen portal into document.body while registering
              it with useLayer.
            </p>
            <div className="activity__actions">
              <button
                type="button"
                onClick={() => setIsPortalLayerOpen(true)}
              >
                Open createPortal + useLayer
              </button>
            </div>
          </section>

          <section className="activity__card">
            <h2>Snippet for reuse</h2>
            <p>
              Copy the minimal setup into any activity when you need an
              immersive modal without leaving the stack.
            </p>
            <pre className="activity__code modal-lab__code">{snippet}</pre>
            <div className="activity__actions">
              <button
                type="button"
                onClick={() =>
                  push("orders", {
                    params: {},
                    flag: "SINGLE_TOP",
                  })
                }
              >
                Navigate to Orders
              </button>
              <button
                type="button"
                onClick={() => push("snapshot", { params: {} })}
              >
                Jump to Snapshot lab
              </button>
            </div>
          </section>
        </div>
      </div>

      <PortalLayerModal
        isOpen={isPortalLayerOpen}
        onClose={() => setIsPortalLayerOpen(false)}
        onPushDetail={pushPortalDetail}
      />
    </AppScreen>
  );
};

export default ModalLabActivity;
