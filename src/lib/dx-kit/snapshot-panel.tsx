// snapshot-panel.tsx
import React, { useState } from "react";

type Snap = { id: string; at: number; route?: string; data: any };

export function StateSnapshotPanel({
  max = 10,
}: {
  max?: number;
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);

  const capture = () => {
    const data = { 
      timestamp: Date.now(),
      pathname: location.pathname,
      localStorage: { ...localStorage }
    };
    const snap: Snap = {
      id: Math.random().toString(36).slice(2),
      at: Date.now(),
      route: location.pathname,
      data,
    };
    setSnaps((arr) => [snap, ...arr].slice(0, max));
  };

  const restore = (snap: Snap) => {
    console.info(
      "[Snapshot] restore needed → wire into redux/zustand setters",
      snap
    );
    alert("복원 훅에 연결 필요: 콘솔 참고");
  };

  const clearAll = () => {
    setSnaps([]);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 10,
        bottom: 10,
        background: "rgba(0,0,0,.7)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
        maxWidth: 300,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Snapshots</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={capture}>Save</button>
        {snaps.length > 0 && <button onClick={clearAll}>Clear All</button>}
      </div>
      <ul style={{ maxHeight: 160, overflow: "auto", marginTop: 6, listStyle: "none", padding: 0 }}>
        {snaps.map((s) => (
          <li key={s.id} style={{ marginBottom: 6 }}>
            <code style={{ fontSize: 10 }}>
              {new Date(s.at).toLocaleTimeString()} · {s.route}
            </code>
            <button onClick={() => restore(s)} style={{ marginLeft: 6, fontSize: 10 }}>
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}