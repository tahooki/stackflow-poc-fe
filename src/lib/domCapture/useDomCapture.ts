import { useCallback, useState } from "react";
import type { RefObject } from "react";
import type { DomToImageOptions } from "dom-to-image-more";

import { captureVisible } from "./captureVisible";

export interface UseDomCaptureResult {
  capture: () => Promise<string | null>;
  loading: boolean;
  error: Error | null;
  lastDataUrl: string | null;
}

// 특정 DOM ref를 캡처하는 React Hook. 호출부는 capture 함수를 눌러 data URL을 얻는다.
export function useDomCapture<T extends HTMLElement>(
  rootRef: RefObject<T>,
  options?: DomToImageOptions
): UseDomCaptureResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null);

  const capture = useCallback(async () => {
    const root = rootRef.current;
    if (!root) {
      const missing = new Error("Capture root is not mounted yet.");
      setError(missing);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await captureVisible(root, options);
      setLastDataUrl(url);
      return url;
    } catch (err) {
      const normalized =
        err instanceof Error
          ? err
          : new Error("An unknown error occurred while capturing the DOM.");
      setError(normalized);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options, rootRef]);

  return { capture, loading, error, lastDataUrl };
}
