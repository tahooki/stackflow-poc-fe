/**
 * PerfHUD는 requestAnimationFrame과 Performance API를 사용해 FPS, JS Heap 사용량,
 * Long Task 발생 횟수를 실시간으로 집계하여 화면에 띄워 주는 경량 오버레이입니다.
 * 모바일(특히 Note20)을 타깃으로 했기 때문에 측정 주기와 경고 임계값이 공격적으로
 * 설정되어 있으며, `danger` 옵션으로 상황에 맞는 경고 임계값을 조정할 수 있습니다.
 */
import React, { useEffect, useRef, useState } from "react";

/**
 * rAF 기반으로 지정한 샘플링 윈도우 동안 발생한 프레임 수를 측정해 FPS를 추정합니다.
 * requestAnimationFrame 사이의 호출 간격이 환경에 따라 미세하게 변하므로,
 * 누적된 프레임과 경과 시간을 이용해 평균 FPS를 계산합니다.
 */
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

/**
 * Chromium/Android에서만 제공되는 `performance.memory`를 이용해 JS Heap 사용량을
 * 1초마다 MB 단위로 샘플링합니다. 지원하지 않는 브라우저에서는 null을 반환합니다.
 */
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

/**
 * PerformanceObserver로 50ms 이상 걸린 Long Task를 감시하여 누적 발생 횟수를 반환합니다.
 * API를 지원하지 않는 환경에서는 조용히 no-op으로 동작합니다.
 */
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

/**
 * 실시간 성능 지표(FPS, Heap, Long Task)를 렌더링하는 고정 위치 HUD입니다.
 * 지정한 `position`에 HUD를 배치하고, 위험 임계값을 초과하면 붉은 배경으로 강조합니다.
 */
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
