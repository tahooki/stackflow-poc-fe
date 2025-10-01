/**
 * LeakHUD/LeakWatch는 WeakRef와 FinalizationRegistry를 활용해 컴포넌트 언마운트 이후
 * 가비지 컬렉션이 지연되는 대상을 추적하고, 잠재적인 메모리 누수 의심 목록을 보여줍니다.
 */
import React, { useEffect, useRef, useState } from "react";

class LeakTracker {
  registry?: FinalizationRegistry<string>;
  items = new Map<
    string,
    { label: string; unmountedAt?: number; finalizedAt?: number }
  >();
  /**
   * FinalizationRegistry가 지원되는 환경에서만 레지스트리를 생성해 GC 완료 시점을 기록합니다.
   */
  constructor() {
    if (typeof FinalizationRegistry !== "undefined") {
      this.registry = new FinalizationRegistry((id) => {
        const it = this.items.get(id);
        if (it) it.finalizedAt = performance.now();
      });
    }
  }
  /**
   * 트래커에 새 인스턴스를 등록하고 언마운트 시각을 기록할 수 있는 핸들을 반환합니다.
   */
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
  /**
   * 레이블별로 현재 살아있는 인스턴스와 grace 기간을 초과한 의심 인스턴스를 집계합니다.
   */
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

/**
 * 컴포넌트에서 호출하면 마운트 시 트래커에 등록하고, 언마운트 시 시각을 기록합니다.
 */
export function useLeakWatch(label: string) {
  const handle = useRef(leakTracker.create(label));
  useEffect(() => () => handle.current.onUnmount(), []);
}

/**
 * 1초마다 누수 스냅샷을 갱신하여 최다 의심 항목 상위 6개를 표시하는 HUD입니다.
 */
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
