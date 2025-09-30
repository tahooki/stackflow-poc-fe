import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import {
  NFXStack,
  type StackRouteConfig,
} from "../lib/NFXStack";

type ViewportSize = {
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type ResizableViewportProps = {
  width: number;
  height: number;
  min: ViewportSize;
  max: ViewportSize;
  onResize: (size: ViewportSize) => void;
  children: ReactNode;
};

const ResizableViewport = ({
  width,
  height,
  min,
  max,
  onResize,
  children,
}: ResizableViewportProps) => {
  const dragStateRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (handle: ResizeHandle) => (event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current = {
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: width,
        startHeight: height,
      };
    },
    [dragStateRef, height, width]
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      let nextWidth = dragState.startWidth;
      let nextHeight = dragState.startHeight;

      if (dragState.handle.includes("e")) {
        nextWidth = dragState.startWidth + deltaX;
      }
      if (dragState.handle.includes("w")) {
        nextWidth = dragState.startWidth - deltaX;
      }
      if (dragState.handle.includes("s")) {
        nextHeight = dragState.startHeight + deltaY;
      }
      if (dragState.handle.includes("n")) {
        nextHeight = dragState.startHeight - deltaY;
      }

      onResize({
        width: clamp(nextWidth, min.width, max.width),
        height: clamp(nextHeight, min.height, max.height),
      });
    };

    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragStateRef, max.height, max.width, min.height, min.width, onResize]);

  return (
    <div
      className="viewport-frame"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="viewport-content">{children}</div>
      {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeHandle[]).map(
        (handle) => (
          <button
            key={handle}
            type="button"
            className={`viewport-handle viewport-handle--${handle}`}
            onPointerDown={handlePointerDown(handle)}
            aria-label={`Resize ${handle}`}
          />
        )
      )}
    </div>
  );
};

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type StackViewportPanelProps = {
  routes: ReadonlyArray<StackRouteConfig>;
  defaultSize: ViewportSize;
  minSize: ViewportSize;
  maxSize: ViewportSize;
};

export const StackViewportPanel = ({
  routes,
  defaultSize,
  minSize,
  maxSize,
}: StackViewportPanelProps) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(defaultSize);

  const handleWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setViewportSize((prev) => ({
        ...prev,
        width: clamp(value, minSize.width, maxSize.width),
      }));
    },
    [maxSize.width, minSize.width]
  );

  const handleHeightChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setViewportSize((prev) => ({
        ...prev,
        height: clamp(value, minSize.height, maxSize.height),
      }));
    },
    [maxSize.height, minSize.height]
  );

  const handleReset = useCallback(() => {
    setViewportSize(defaultSize);
  }, [defaultSize]);

  return (
    <section className="viewport-panel panel">
      <header className="panel__header">
        <h2>스택 플레이그라운드</h2>
        <span className="panel__meta">
          width/height를 직접 입력하거나 핸들을 잡아 리사이즈하세요.
        </span>
      </header>
      <div className="viewport-toolbar">
        <label>
          W
          <input
            type="number"
            min={minSize.width}
            max={maxSize.width}
            value={Math.round(viewportSize.width)}
            onChange={handleWidthChange}
          />
        </label>
        <label>
          H
          <input
            type="number"
            min={minSize.height}
            max={maxSize.height}
            value={Math.round(viewportSize.height)}
            onChange={handleHeightChange}
          />
        </label>
        <button
          type="button"
          className="viewport-toolbar__reset"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      <div className="viewport-stage">
        <NFXStack routes={routes}>
          {(StackComponent) => (
            <ResizableViewport
              width={viewportSize.width}
              height={viewportSize.height}
              min={minSize}
              max={maxSize}
              onResize={setViewportSize}
            >
              <div className="stack-host">
                <StackComponent />
              </div>
            </ResizableViewport>
          )}
        </NFXStack>
      </div>
    </section>
  );
};
