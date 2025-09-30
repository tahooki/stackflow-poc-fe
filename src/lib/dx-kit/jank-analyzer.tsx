// jank-analyzer.tsx
import React, { useEffect, useRef, useState } from "react";

type Hit = { at: number; y: number };
export function JankAnalyzer({ threshold = 0.2 }: { threshold?: number }) {
  const [hits, setHits] = useState<Hit[]>([]);
  const last = useRef({ t: performance.now(), y: window.scrollY });
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = now - last.current.t; // ms
      const dy = Math.abs(window.scrollY - last.current.y);
      last.current = { t: now, y: window.scrollY };
      // 드랍 추정: dt가 16.7ms* (1+threshold) 보다 크게 튀면 hit
      if (dt > 16.7 * (1 + threshold))
        setHits((h) => [...h.slice(-49), { at: now, y: window.scrollY }]);
    };
    const loop = (t: number) => {
      prev = t;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return (
    <>
      {hits.slice(-5).map((h, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: h.y,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(239,68,68,.8)",
            pointerEvents: "none",
          }}
        />
      ))}
      <div
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          background: "rgba(0,0,0,.7)",
          color: "#fff",
          padding: 6,
          borderRadius: 6,
          font: "12px ui-monospace,monospace",
          zIndex: 2147483647,
        }}
      >
        Jank hits: {hits.length}
      </div>
    </>
  );
}