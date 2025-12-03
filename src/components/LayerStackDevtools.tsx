import { useMemo, useState, type CSSProperties } from "react";

import { useLayerStack } from "../contexts/LayerStackContext";

const containerStyle: CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom: "12px",
  zIndex: 9999,
  fontFamily: "Menlo, Consolas, monospace",
};

const panelStyle: CSSProperties = {
  marginTop: "6px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(16, 24, 40, 0.9)",
  color: "#f8fafc",
  boxShadow: "0 8px 26px rgba(0,0,0,0.28)",
  width: "320px",
  maxHeight: "260px",
  overflowY: "auto",
};

export const LayerStackDevtools = () => {
  const { state } = useLayerStack();
  const [open, setOpen] = useState(false);

  const frames = useMemo(
    () => state.frames.map((frame, index) => ({ ...frame, index })),
    [state.frames]
  );

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          border: "1px solid #cbd5e1",
          background: "#0f172a",
          color: "#e2e8f0",
          padding: "6px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Layers · A{state.activityCount} / S{state.stepCount} / M
        {state.modalCount}
      </button>

      {open ? (
        <div style={panelStyle}>
          <strong style={{ display: "block", marginBottom: "6px" }}>
            Layer stack ({frames.length})
          </strong>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, gap: 4 }}>
            {frames.map((frame) => (
              <li
                key={`${frame.kind}-${frame.id}-${frame.index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 8px",
                  marginBottom: 4,
                  borderRadius: 6,
                  background:
                    frame.kind === "modal"
                      ? "rgba(56, 189, 248, 0.12)"
                      : frame.kind === "step"
                      ? "rgba(168, 85, 247, 0.14)"
                      : "rgba(52, 211, 153, 0.12)",
                  color: "#e2e8f0",
                }}
              >
                <span>
                  [{frame.index}] {frame.kind.toUpperCase()} · {frame.id}
                </span>
                {"name" in frame && frame.name ? (
                  <span style={{ color: "#cbd5e1" }}>{frame.name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
