/**
 * RerenderHeatmap은 컴포넌트가 다시 렌더링될 때 일시적으로 외곽선을 강조하고,
 * 렌더 횟수를 배지로 표시하여 리렌더 지점을 눈으로 추적할 수 있게 해줍니다.
 * WeakMap을 이용해 각 컴포넌트 인스턴스를 추적하고, 단축키(Cmd/Ctrl+Shift+R)로
 * 시각화 토글을 활성화하도록 설계되어 있습니다.
 */
import React, { useEffect, useRef, useState } from "react";

const bus = { lastRenders: new WeakMap<object, number>() };

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

/**
 * 간편한 사용을 위해 제공하는 래퍼 컴포넌트로, 자식에 렌더 배지를 부착하고
 * `data-rerender` 속성을 자동으로 지정합니다.
 */
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
