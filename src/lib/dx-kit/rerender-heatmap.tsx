// rerender-heatmap.tsx
import React, { useEffect, useRef, useState } from "react";

const bus = { lastRenders: new WeakMap<object, number>() };

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

export function RerenderHeatmap({
  enabledShortcut = true,
}: {
  enabledShortcut?: boolean;
}) {
  const [on, setOn] = useState(false);
  const cssText =
    "*[data-rerender=\"1\"]{outline:2px solid rgba(59,130,246,.9)!important;outline-offset:2px;border-radius:6px}";
  useEffect(() => {
    if (!enabledShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyR";
      if (mod) {
        setOn(true);
        setTimeout(() => setOn(false), 1500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabledShortcut]);

  useEffect(() => {
    if (!on) return;
    const supportAdoptedSheets = Array.isArray(
      // @ts-expect-error adoptedStyleSheets is not in lib.dom yet
      document.adoptedStyleSheets
    );

    if (supportAdoptedSheets) {
      const sheets = new CSSStyleSheet();
      sheets.replaceSync(cssText);
      // @ts-expect-error adoptedStyleSheets is still readonly in the DOM lib typings
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheets];
      const id = setTimeout(() => {
        // @ts-expect-error adoptedStyleSheets is still readonly in the DOM lib typings
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
          (s: CSSStyleSheet) => s !== sheets
        );
      }, 1500);
      return () => clearTimeout(id);
    }

    const style = document.createElement("style");
    style.setAttribute("data-rerender-heatmap", "1");
    style.textContent = cssText;
    document.head.appendChild(style);
    const id = setTimeout(() => {
      style.remove();
    }, 1500);
    return () => {
      clearTimeout(id);
      style.remove();
    };
  }, [on]);

  return null;
}

// 사용 예: 컴포넌트 루트 div에 data-rerender 바인딩
export function Box({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { count } = useRenderCounter(label);
  return (
    <div data-rerender={1} style={{ position: "relative" }}>
      <RerenderBadge label={label} count={count} />
      {children}
    </div>
  );
}
