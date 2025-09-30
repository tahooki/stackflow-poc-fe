// leak-watch.tsx
import React, { useEffect, useRef, useState } from "react";

class LeakTracker {
  registry?: FinalizationRegistry<string>;
  items = new Map<
    string,
    { label: string; unmountedAt?: number; finalizedAt?: number }
  >();
  constructor() {
    if (typeof FinalizationRegistry !== "undefined") {
      this.registry = new FinalizationRegistry((id) => {
        const it = this.items.get(id);
        if (it) it.finalizedAt = performance.now();
      });
    }
  }
  create(label: string) {
    const id = `${label}#${Math.random().toString(36).slice(2)}`;
    const token = { id };
    this.items.set(id, { label });
    this.registry?.register(token, id);
    return {
      id,
      onUnmount: () => {
        const it = this.items.get(id);
        if (it) it.unmountedAt = performance.now();
      },
    };
  }
  snapshot(graceMs = 15000) {
    const now = performance.now();
    const by: Record<string, { alive: number; suspected: number }> = {};
    for (const [id, it] of this.items) {
      const key = it.label;
      by[key] ??= { alive: 0, suspected: 0 };
      by[key].alive++;
      if (it.unmountedAt && !it.finalizedAt && now - it.unmountedAt > graceMs)
        by[key].suspected++;
    }
    return by;
  }
}
export const leakTracker = new LeakTracker();

export function useLeakWatch(label: string) {
  const handle = useRef(leakTracker.create(label));
  useEffect(() => () => handle.current.onUnmount(), []);
}

export function LeakHUD() {
  const [snap, setSnap] = useState(leakTracker.snapshot());
  useEffect(() => {
    const id = setInterval(() => setSnap(leakTracker.snapshot()), 1000);
    return () => clearInterval(id);
  }, []);
  const rows = Object.entries(snap)
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.suspected - a.suspected)
    .slice(0, 6);
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        background: "rgba(0,0,0,.75)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
      }}
    >
      <div style={{ fontWeight: 700 }}>Leak Watch</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 10, opacity: 0.7 }}>No components tracked</div>
      ) : (
        rows.map((r) => (
          <div key={r.label} style={{ fontSize: 11 }}>
            {r.label}: alive {r.alive} ·{" "}
            {r.suspected > 0 ? `LEAK? ${r.suspected}` : "ok"}
          </div>
        ))
      )}
    </div>
  );
}