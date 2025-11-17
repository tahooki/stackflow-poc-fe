import domtoimage from "dom-to-image-more";
import type { DomToImageOptions } from "dom-to-image-more";

import {
  applyScrollStates,
  cleanupScrollMarks,
  collectScrollStates,
} from "./scrollState";
import type { ScrollInfo } from "./types";

const SCROLLBAR_STYLE_ID = "dom-capture-hide-scrollbars";

function getDefaultScale(explicitScale?: number): number {
  if (typeof explicitScale === "number") {
    return explicitScale;
  }

  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, 2);
}

export async function captureVisible(
  root: HTMLElement,
  options: DomToImageOptions = {}
): Promise<string> {
  if (!root) {
    throw new Error("captureVisible requires a mounted root element.");
  }

  const scrollStates = collectScrollStates(root);
  const scale = getDefaultScale(options.scale);
  const restoreOriginalScrollbars = applyOriginalScrollbarMask(root, scrollStates);

  const scrollStateMap = new Map(scrollStates.map((state) => [state.id, state]));
  const userAdjustClonedNode = options.adjustClonedNode;
  const userOnClone = options.onclone;
  const mergedOptions: DomToImageOptions = {
    cacheBust: true,
    ...options,
    scale,
    adjustClonedNode: (original, clone, after) => {
      if (
        after &&
        clone instanceof HTMLElement &&
        original instanceof HTMLElement
      ) {
        const identifier = original.dataset?.scrollId;
        if (identifier) {
          const savedState = scrollStateMap.get(identifier);
          if (savedState) {
            clone.scrollLeft = savedState.x;
            clone.scrollTop = savedState.y;
            applyViewportMask(clone, savedState);
          }
        }
      }

      userAdjustClonedNode?.(original, clone, after);
    },
    onclone: (clone) => {
      applyScrollStates(clone, scrollStates);
      return userOnClone?.(clone);
    },
  };

  try {
    const fullCanvas = await domtoimage.toCanvas(root, mergedOptions);
    const clipRect = resolveVisibleClip(root);
    if (!clipRect) {
      return fullCanvas.toDataURL("image/png");
    }

    const clippedCanvas = cropCanvas(fullCanvas, clipRect, scale);
    return clippedCanvas.toDataURL("image/png");
  } finally {
    restoreOriginalScrollbars();
    cleanupScrollMarks(root);
  }
}

type ClipRect = {
  width: number;
  height: number;
  x: number;
  y: number;
};

function resolveVisibleClip(root: HTMLElement): ClipRect | null {
  const hasIntrinsicScroll =
    root.scrollWidth - root.clientWidth > 1 ||
    root.scrollHeight - root.clientHeight > 1;

  if (hasIntrinsicScroll) {
    if (root.clientWidth === 0 || root.clientHeight === 0) {
      return null;
    }
    return {
      width: root.clientWidth,
      height: root.clientHeight,
      x: root.scrollLeft,
      y: root.scrollTop,
    };
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const rect = root.getBoundingClientRect();
  const viewportWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    rect.width;
  const viewportHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    rect.height;

  const visibleLeft = Math.max(0, -rect.left);
  const visibleTop = Math.max(0, -rect.top);
  const visibleRight = Math.min(rect.width, viewportWidth - rect.left);
  const visibleBottom = Math.min(rect.height, viewportHeight - rect.top);

  const clipWidth = Math.max(0, visibleRight - visibleLeft);
  const clipHeight = Math.max(0, visibleBottom - visibleTop);

  if (clipWidth === 0 || clipHeight === 0) {
    return null;
  }

  return {
    width: clipWidth,
    height: clipHeight,
    x: visibleLeft,
    y: visibleTop,
  };
}

function cropCanvas(
  canvas: HTMLCanvasElement,
  clip: ClipRect,
  scale: number
): HTMLCanvasElement {
  const width = Math.max(1, Math.round(clip.width * scale));
  const height = Math.max(1, Math.round(clip.height * scale));

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = width;
  cropCanvas.height = height;

  const context = cropCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize capture canvas.");
  }

  const maxSourceX = Math.max(0, canvas.width - width);
  const maxSourceY = Math.max(0, canvas.height - height);

  const sourceX = clamp(Math.round(clip.x * scale), 0, maxSourceX);
  const sourceY = clamp(Math.round(clip.y * scale), 0, maxSourceY);

  context.drawImage(
    canvas,
    sourceX,
    sourceY,
    width,
    height,
    0,
    0,
    width,
    height
  );

  return cropCanvas;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function applyViewportMask(element: HTMLElement, state: ScrollInfo) {
  ensureScrollbarStyle(element.ownerDocument ?? null);
  element.classList.add("dom-capture-scroll-mask");
  element.style.overflow = "hidden";

  if (state.width > 0) {
    element.style.width = `${state.width}px`;
  }
  if (state.height > 0) {
    element.style.height = `${state.height}px`;
  }

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width =
    state.contentWidth > 0 ? `${state.contentWidth}px` : "100%";
  wrapper.style.height =
    state.contentHeight > 0 ? `${state.contentHeight}px` : "100%";
  wrapper.style.display = "block";
  wrapper.removeAttribute("data-scroll-id");

  while (element.firstChild) {
    wrapper.appendChild(element.firstChild);
  }

  applyLayoutSnapshot(wrapper, state);

  const transforms: string[] = [];
  if (state.x) {
    transforms.push(`translateX(-${state.x}px)`);
  }
  if (state.y) {
    transforms.push(`translateY(-${state.y}px)`);
  }

  if (transforms.length > 0) {
    wrapper.style.willChange = "transform";
    wrapper.style.transform = transforms.join(" ");
  }

  element.appendChild(wrapper);
}

function applyLayoutSnapshot(target: HTMLElement, state: ScrollInfo) {
  const layout = state.layout;
  if (!layout) {
    return;
  }

  if (layout.display) {
    target.style.display = layout.display;
  }
  if (layout.flexDirection) {
    target.style.flexDirection = layout.flexDirection;
  }
  if (layout.flexWrap) {
    target.style.flexWrap = layout.flexWrap;
  }
  if (layout.alignItems) {
    target.style.alignItems = layout.alignItems;
  }
  if (layout.alignContent) {
    target.style.alignContent = layout.alignContent;
  }
  if (layout.justifyContent) {
    target.style.justifyContent = layout.justifyContent;
  }
  if (layout.gap) {
    target.style.gap = layout.gap;
  }
  if (layout.rowGap) {
    target.style.rowGap = layout.rowGap;
  }
  if (layout.columnGap) {
    target.style.columnGap = layout.columnGap;
  }
  if (layout.whiteSpace) {
    target.style.whiteSpace = layout.whiteSpace;
  }
}

function applyOriginalScrollbarMask(
  root: HTMLElement,
  states: ScrollInfo[]
): () => void {
  const doc = root.ownerDocument ?? null;
  ensureScrollbarStyle(doc);
  const applied: HTMLElement[] = [];

  states.forEach(({ id }) => {
    const target =
      (root.matches(`[data-scroll-id="${id}"]`)
        ? (root as HTMLElement)
        : root.querySelector<HTMLElement>(`[data-scroll-id="${id}"]`)) ?? null;

    if (target && !applied.includes(target)) {
      target.classList.add("dom-capture-scroll-mask");
      applied.push(target);
    }
  });

  return () => {
    applied.forEach((element) => {
      element.classList.remove("dom-capture-scroll-mask");
    });
  };
}

function ensureScrollbarStyle(doc: Document | null) {
  if (!doc) {
    return;
  }

  if (doc.getElementById(SCROLLBAR_STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = SCROLLBAR_STYLE_ID;
  style.textContent = `
    .dom-capture-scroll-mask {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    .dom-capture-scroll-mask::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  `;
  doc.head.appendChild(style);
}
