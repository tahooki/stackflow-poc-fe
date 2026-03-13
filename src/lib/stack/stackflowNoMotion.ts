const STACKFLOW_NO_MOTION_ATTR = "data-stackflow-no-motion";

let activeLocks = 0;

const runAfterPaint = (callback: () => void) => {
  if (typeof window === "undefined" || !window.requestAnimationFrame) {
    setTimeout(callback, 0);
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
};

const getRoot = () =>
  typeof document === "undefined" ? null : document.documentElement;

export const withTemporaryStackflowNoMotion = <T>(callback: () => T): T => {
  const root = getRoot();

  if (!root) {
    return callback();
  }

  activeLocks += 1;
  root.setAttribute(STACKFLOW_NO_MOTION_ATTR, "true");

  try {
    return callback();
  } finally {
    runAfterPaint(() => {
      activeLocks = Math.max(0, activeLocks - 1);

      if (activeLocks === 0) {
        root.removeAttribute(STACKFLOW_NO_MOTION_ATTR);
      }
    });
  }
};

export const shouldSuppressMotionForDispatchEvent = (
  name: string,
  parameters: Record<string, unknown> | undefined,
) => {
  if (!parameters) {
    return false;
  }

  if (name === "Pushed" || name === "Replaced") {
    return parameters.skipEnterActiveState === true;
  }

  if (name === "Popped") {
    return parameters.skipExitActiveState === true;
  }

  return false;
};

export const shouldSuppressMotionForAnimateOption = (
  options?: { animate?: boolean },
) => options?.animate === false;

export const shouldSuppressMotionForPopArgs = (
  count?: number | { animate?: boolean },
  options?: { animate?: boolean },
) => {
  if (typeof count === "number") {
    if (count > 1) {
      return true;
    }

    return shouldSuppressMotionForAnimateOption(options);
  }

  if (count && typeof count === "object") {
    return shouldSuppressMotionForAnimateOption(count);
  }

  return shouldSuppressMotionForAnimateOption(options);
};

export { STACKFLOW_NO_MOTION_ATTR };
