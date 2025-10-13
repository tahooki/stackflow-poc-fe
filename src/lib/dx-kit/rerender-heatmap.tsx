/**
 * RerenderHeatmap은 컴포넌트가 다시 렌더링될 때 일시적으로 외곽선을 강조하고,
 * 렌더 횟수를 배지로 표시하여 리렌더 지점을 눈으로 추적할 수 있게 해줍니다.
 * 2024-xx-xx 개편: 렌더 타이밍에 따라 자동으로 하이라이트되며, 단축키(Cmd/Ctrl+Shift+R)
 * 를 누르면 전역 플래시로 모든 추적 대상을 한 번에 확인할 수도 있습니다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type Listener = () => void;
const bus = {
  lastRenders: new WeakMap<object, number>(),
  listeners: new Set<Listener>(),
};

/**
 * 훅이 호출될 때마다 렌더 타임스탬프를 갱신하고 누적 렌더 횟수를 반환합니다.
 * label은 배지 표시에 사용되며, WeakMap 키로 토큰 객체를 사용해 GC를 방해하지 않습니다.
 */
export function useRenderCounter(label?: string) {
  const token = useRef({});
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    const now = performance.now();
    bus.lastRenders.set(token.current, now);
  });

  return { count: renderCount.current, label };
}

export function useRerenderFlash(flashDuration = 1200) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const triggerFlash = useCallback(() => {
    setActive(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setActive(false);
      timerRef.current = null;
    }, flashDuration);
  }, [flashDuration]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    bus.listeners.add(triggerFlash);
    return () => {
      bus.listeners.delete(triggerFlash);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [triggerFlash]);

  return { active, triggerFlash };
}

/**
 * `useRenderCounter`가 반환하는 렌더 횟수를 시각적으로 표시하는 배지 컴포넌트입니다.
 */
export function RerenderBadge({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        background: "rgba(0,0,0,.6)",
        color: "#fff",
        padding: "2px 6px",
        borderRadius: 6,
        font: "11px ui-monospace,monospace",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {label} · {count}
    </div>
  );
}

/**
 * 단축키가 눌리면 CSSStyleSheet를 임시로 주입해 `data-rerender="1"` 요소를 하이라이트합니다.
 * 1.5초 후 자동으로 스타일을 제거하여 UI에 잔여 영향이 남지 않도록 합니다.
 */
export function RerenderHeatmap({
  enabledShortcut = true,
}: {
  enabledShortcut?: boolean;
}) {
  const cssText =
    "*[data-rerender=\"1\"]{outline:2px solid rgba(59,130,246,.9)!important;outline-offset:2px;border-radius:6px}";

  // 기본 스타일은 항상 주입해 두어 auto flash가 바로 동작하도록 한다.
  useEffect(() => {
    const doc = document as any;
    const supportAdoptedSheets = Array.isArray(doc.adoptedStyleSheets);

    if (supportAdoptedSheets) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      return () => {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter(
          (s: CSSStyleSheet) => s !== sheet
        );
      };
    }

    const style = document.createElement("style");
    style.setAttribute("data-rerender-heatmap", "1");
    style.textContent = cssText;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [cssText]);

  // 단축키를 누르면 모든 추적 대상이 동시에 점멸하도록 신호를 보낸다.
  useEffect(() => {
    if (!enabledShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyR";
      if (mod) {
        bus.listeners.forEach((listener) => listener());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabledShortcut]);

  return null;
}

/**
 * 간편한 사용을 위해 제공하는 래퍼 컴포넌트로, 자식에 렌더 배지를 부착하고
 * `data-rerender` 속성을 자동으로 지정합니다.
 */
export function Box({
  label,
  children,
  style,
  flashDuration = 1200,
  highlightOnMount = false,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
  flashDuration?: number;
  highlightOnMount?: boolean;
}) {
  const { count } = useRenderCounter(label);
  const { active, triggerFlash } = useRerenderFlash(flashDuration);

  useEffect(() => {
    if (count === 1) {
      if (highlightOnMount) {
        triggerFlash();
      }
      return;
    }
    triggerFlash();
  }, [count, highlightOnMount, triggerFlash]);

  return (
    <div
      data-rerender={active ? "1" : undefined}
      style={{ position: "relative", ...style }}
      data-rerender-count={count}
    >
      <RerenderBadge label={label} count={count} />
      {children}
    </div>
  );
}
