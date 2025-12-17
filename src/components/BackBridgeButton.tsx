import type React from "react";

const buttonStyle: React.CSSProperties = {
  position: "fixed",
  left: "12px",
  bottom: "72px",
  zIndex: 9999,
  padding: "8px 12px",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: "12px",
  cursor: "pointer",
};

export const BackBridgeButton = () => {
  const triggerBack = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.onBackKeyClick?.();
  };

  return (
    <button type="button" style={buttonStyle} onClick={triggerBack}>
      Back (window.onBackKeyClick)
    </button>
  );
};
