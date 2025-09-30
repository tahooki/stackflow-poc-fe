// PerfHUD.tsx
import React, { useEffect, useRef, useState } from "react";

function useFps(sampleMs = 500) {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const t0 = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      frames.current++;
      if (now - t0.current >= sampleMs) {
        setFps(Math.round((frames.current * 1000) / (now - t0.current)));
        frames.current = 0;
        t0.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sampleMs]);
  return fps;
}

function useHeapMB() {
  const [mb, setMb] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const m: any = (performance as any).memory;
      if (m?.usedJSHeapSize)
        setMb(Math.round(m.usedJSHeapSize / (1024 * 1024)));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return mb;
}

function useLongTasks() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    try {
      const obs = new PerformanceObserver((list) => {
        setCount((c) => c + list.getEntries().length);
      });
      // @ts-ignore
      obs.observe({ type: "longtask", buffered: true });
      return () => obs.disconnect();
    } catch {}
  }, []);
  return count;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export function PerfHUD({
  danger = { fps: 45, heapMB: 300 },
  position = "top-right" as const,
}: {
  danger?: { fps: number; heapMB: number };
  position?: Position;
}) {
  const fps = useFps();
  const heap = useHeapMB();
  const longTasks = useLongTasks();
  const dangerOn = (fps && fps < danger.fps) || (heap && heap > danger.heapMB);
  const pos = {
    "top-left": { top: 10, left: 10 },
    "top-right": { top: 10, right: 10 },
    "bottom-left": { bottom: 10, left: 10 },
    "bottom-right": { bottom: 10, right: 10 },
  }[position];

  useEffect(() => {
    if (dangerOn) console.info("[PerfHUD] danger", { fps, heap });
  }, [dangerOn, fps, heap]);

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 2147483647,
        padding: "6px 8px",
        borderRadius: 8,
        font: "12px ui-monospace,monospace",
        background: dangerOn ? "rgba(220,38,38,.9)" : "rgba(0,0,0,.75)",
        color: "#fff",
        boxShadow: "0 4px 18px rgba(0,0,0,.2)",
        ...pos,
      }}
    >
      <div>FPS: {fps}</div>
      <div>Heap: {heap ? `${heap}MB` : "N/A"}</div>
      <div>LongTasks: {longTasks}</div>
    </div>
  );
}