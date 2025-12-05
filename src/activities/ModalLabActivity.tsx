import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useActivity, type ActivityComponentType } from "@stackflow/react";
import Modal from "react-modal";
import { useCallback, useEffect, useMemo } from "react";

import "../assets/modalLab.css";
import { useNavActions } from "../hooks/useNavActions";
import { useImperativeModal } from "../hooks/useImperativeModal";

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

const ModalLabActivity: ActivityComponentType = () => {
  const activity = useActivity();
  const { push } = useNavActions();
  const {
    open: openImperativeModal,
    ModalPortal,
  } = useImperativeModal({
    id: "modal-lab-overlay",
    overlayClassName: "modal-lab__overlay",
    contentClassName: "modal-lab__content",
    bodyOpenClassName: "modal-lab__body-open",
  });

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  const openModal = useCallback(
    (template: ModalTemplate) => {
      openImperativeModal({
        label: template.title,
        render: ({ close }) => (
          <>
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
                <span>react-modal</span>
                <span>Full-screen overlay</span>
                <span>Accessible focus trap</span>
              </div>
              <div className="modal-lab__controls">
                <button
                  type="button"
                  className="modal-lab__ghost"
                  onClick={close}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    push("detail", {
                      id: "modal-hop",
                      title: "Opened from Modal.open() demo",
                    });
                  }}
                >
                  Close and push Detail
                </button>
              </div>
            </div>
          </>
        ),
      });
    },
    [openImperativeModal, push]
  );

  const templateButtons = useMemo(
    () =>
      templates.map((template) => (
        <button
          key={template.title}
          type="button"
          onClick={() => openModal(template)}
        >
          Modal.open(): {template.title}
        </button>
      )),
    [openModal]
  );

  const snippet = `Modal.setAppElement('#root');

const { open, ModalPortal } = useImperativeModal({
  id: 'my-overlay',
  overlayClassName: 'modal-lab__overlay',
  contentClassName: 'modal-lab__content',
});

const openModal = () =>
  open({
    label: 'My modal',
    render: ({ close }) => (
      <div>
        Modal.open() content
        <button onClick={close}>Close</button>
      </div>
    ),
  });

return (
  <>
    <button onClick={openModal}>Modal.open()</button>
    <ModalPortal />
  </>
);`;

  return (
    <AppScreen appBar={{ title: "Modal Lab" }}>
      <div className="activity modal-lab">
        <section className="activity__header">
          <h1>React Modal sandbox</h1>
          <p>
            Drop in react-modal and fire a full-screen overlay from a simple
            Modal.open()-style helper.
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
                  push("orders", undefined, { navFlag: { flag: "SINGLE_TOP" } })
                }
              >
                Navigate to Orders
              </button>
              <button type="button" onClick={() => push("snapshot", undefined)}>
                Jump to Snapshot lab
              </button>
            </div>
          </section>
        </div>
      </div>

      {activity.isTop ? <ModalPortal /> : null}
    </AppScreen>
  );
};

export default ModalLabActivity;
