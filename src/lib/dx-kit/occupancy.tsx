/**
 * OccupancyHUD는 React Profiler, 이벤트 핸들러, 이펙트 실행 시간을 합산해
 * 컴포넌트별 메인 스레드 점유 시간을 추적하는 도구입니다.
 * render/commit/event/effect 구간을 분리해 누적 시간을 기록하고 상위 항목을 표시합니다.
 */
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

/**
 * React Profiler HOC로 감싼 컴포넌트의 render/commit 시간을 자동으로 누적 기록합니다.
 */
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

/**
 * 이벤트 핸들러 실행 시간을 측정해 Occupancy 스토어에 `event` 시간으로 기록합니다.
 */
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

/**
 * Effect와 cleanup 구간의 실행 시간을 측정해 Occupancy 스토어에 `effect`로 더합니다.
 */
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

/**
 * 1초 주기로 스토어 스냅샷을 취해 상위 8개 항목을 HUD로 렌더링합니다.
 */
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
