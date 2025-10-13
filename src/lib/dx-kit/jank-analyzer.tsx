/**
 * JankAnalyzer는 스크롤 이벤트와 requestAnimationFrame 간의 간격을 비교해
 * 예상보다 긴 프레임 간격(=jank)이 발생한 위치를 화면에 표시합니다.
 * 임계값(`threshold`)을 높일수록 더 큰 프레임 드랍만 잡아냅니다.
 */
import { useEffect, useRef, useState } from "react";

type Hit = { at: number; y: number };

/**
 * 스크롤 시점 간의 시간 차이가 16.7ms 기준에서 threshold 배수를 초과하면 히트를 기록합니다.
 */
export function JankAnalyzer({ threshold = 0.2 }: { threshold?: number }) {
  const [hits, setHits] = useState<Hit[]>([]);
  const last = useRef({ t: performance.now(), y: window.scrollY });
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      const now = performance.now();
      const dt = now - last.current.t; // ms
      last.current = { t: now, y: window.scrollY };
      // 드랍 추정: dt가 16.7ms* (1+threshold) 보다 크게 튀면 hit
      if (dt > 16.7 * (1 + threshold))
        setHits((h) => [...h.slice(-49), { at: now, y: window.scrollY }]);
    };
    const loop = () => {
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
