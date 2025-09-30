// occupancy.tsx
import React, { Profiler, useCallback, useEffect, useState } from "react";

const store = new Map<
  string,
  { render: number; commit: number; event: number; effect: number; ts: number }
>();
const add = (k: string, f: keyof ReturnType<typeof getZero>, ms: number) => {
  const v = store.get(k) ?? getZero();
  v[f] += ms;
  v.ts = performance.now();
  store.set(k, v);
};
function getZero() {
  return { render: 0, commit: 0, event: 0, effect: 0, ts: performance.now() };
}

export function withRenderProfiler<P extends object>(
  Comp: React.ComponentType<P>,
  label?: string
) {
  const name = label ?? Comp.displayName ?? Comp.name ?? "Component";
  return (props: P) => (
    <Profiler
      id={name}
      onRender={(id, phase, actualDuration, baseDuration, start, commit) => {
        add(id, "render", actualDuration);
        add(id, "commit", Math.max(0, commit - start - actualDuration));
      }}
    >
      <Comp {...props} />
    </Profiler>
  );
}

export function useInstrumentedHandler<T extends (...a: any[]) => any>(
  label: string,
  fn: T
): T {
  return useCallback(
    ((...args: any[]) => {
      const t0 = performance.now();
      try {
        return fn(...args);
      } finally {
        add(label, "event", performance.now() - t0);
      }
    }) as any,
    [label, fn]
  ) as T;
}

export function useTimedEffect(
  label: string,
  cb: React.EffectCallback,
  deps: any[]
) {
  useEffect(() => {
    const t0 = performance.now();
    let clean: any;
    try {
      clean = cb();
    } finally {
      add(label, "effect", performance.now() - t0);
    }
    return () => {
      const c0 = performance.now();
      clean?.();
      add(label, "effect", performance.now() - c0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function OccupancyHUD() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      const snap = Array.from(store.entries())
        .map(([k, v]) => ({
          label: k,
          total: v.render + v.commit + v.event + v.effect,
          ...v,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      setRows(snap);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        left: 10,
        background: "rgba(0,0,0,.75)",
        color: "#fff",
        padding: 8,
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        zIndex: 2147483647,
        minWidth: 260,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        Event Occupancy (≈10s)
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 10, opacity: 0.7 }}>No activity tracked</div>
      ) : (
        rows.map((r) => (
          <div key={r.label} style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{r.label}</span>
              <b>{Math.round(r.total)}ms</b>
            </div>
            <small style={{ fontSize: 9 }}>
              render {Math.round(r.render)} · commit {Math.round(r.commit)} ·
              event {Math.round(r.event)} · effect {Math.round(r.effect)}
            </small>
          </div>
        ))
      )}
    </div>
  );
}
