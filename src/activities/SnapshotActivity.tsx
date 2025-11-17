import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useCallback, useMemo, useRef, useState } from "react";

import "../assets/snapshotActivity.css";
import { captureVisible } from "../lib/domCapture";

type CaptureStatus =
  | "idle"
  | "capturing"
  | "copied"
  | "downloaded"
  | "shared"
  | "error";

const labMetricSource = [
  { label: "Stack Depth", value: "07 activities" },
  { label: "Scroll Y", value: "3,420 px" },
  { label: "Scroll X Hotspots", value: "4 rails" },
  { label: "Last Capture", value: "Just now" },
];

const scrollRailExperiments = [
  "Shader-heavy timeline",
  "Nested grid stress test",
  "Virtualized chat backlog",
  "3D card wall prototype",
  "Pinned inspector",
  "Story carousel",
  "Board view",
  "Screenshot lab",
];

const useLogEntries = () =>
  useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 28 }, (_, index) => {
      const timestamp = new Date(now - index * 3500)
        .toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/^24:/, "00:");
      const stage =
        index % 3 === 0 ? "Renderer" : index % 2 === 0 ? "Stack" : "Measure";
      return {
        id: `log-${index}`,
        timestamp,
        message: `${stage} probe #${index + 1} stabilized with ${
          20 + (index % 5) * 4
        }ms long task.`,
      };
    });
  }, []);

const useGridCards = () =>
  useMemo(
    () => [
      {
        title: "Flex orchestration",
        description:
          "Nested flex containers stretch across both axes to mimic dashboard behavior.",
        bullets: [
          "Sticky control lane",
          "Auto rows for cards",
          "Shadow layering",
        ],
      },
      {
        title: "Vertical marathon",
        description:
          "Simulated backlog with 28 entries keeps the DOM tall for scroll retention checks.",
        bullets: [
          "Timestamp alignment",
          "Monospace gutters",
          "Dotted dividers",
        ],
      },
      {
        title: "Horizontal stress rail",
        description:
          "Cards intentionally overflow to trigger inertia scrolling and compositing.",
        bullets: ["GPU-friendly gradients", "Fixed min widths", "Edge fading"],
      },
      {
        title: "Snapshot service",
        description:
          "Captures whatever is visible through dom-to-image-more and ships it to the clipboard.",
        bullets: [
          "ClipboardItem fallback",
          "Pixel ratio scaling",
          "Optimistic status API",
        ],
      },
    ],
    []
  );

const useChartData = () =>
  useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        label: `${index + 1}x stack`,
        value: 30 + (index % 3) * 18 + index * 4,
      })),
    []
  );

const buildStatusCopy = (
  status: CaptureStatus,
  errorMessage?: string | null
) => {
  switch (status) {
    case "capturing":
      return "Capturing canvas… hold tight.";
    case "copied":
      return "Screenshot copied to clipboard. Paste it anywhere!";
    case "downloaded":
      return "Clipboard API unavailable—PNG downloaded instead.";
    case "shared":
      return "Shared via your device’s navigation menu.";
    case "error":
      return `Capture failed: ${errorMessage ?? "unknown issue"}.`;
    default:
      return "Hit capture to snapshot the current viewport.";
  }
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [metadata, base64] = dataUrl.split(",");
  if (!metadata || !base64) {
    throw new Error("Invalid capture output.");
  }

  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/png";
  const decoder =
    typeof window !== "undefined" && typeof window.atob === "function"
      ? window.atob.bind(window)
      : typeof atob === "function"
      ? atob
      : null;

  if (!decoder) {
    throw new Error("Base64 decoding is unavailable in this environment.");
  }

  const binary = decoder(base64);
  const buffer = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }

  return new Blob([buffer], { type: mimeType });
};

const SnapshotActivity: ActivityComponentType = () => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const logEntries = useLogEntries();
  const gridCards = useGridCards();
  const chartData = useChartData();

  const scrollViewport = useCallback((direction: "top" | "bottom") => {
    const node = viewportRef.current;
    const shouldUseWindow = !node || node.scrollHeight <= node.clientHeight + 1;

    if (!shouldUseWindow && node) {
      node.scrollTo({
        top: direction === "top" ? 0 : node.scrollHeight,
        behavior: "smooth",
      });
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const doc = document.documentElement;
    const body = document.body;
    const fallbackHeight = doc.scrollHeight || body?.scrollHeight || 0;

    window.scrollTo({
      top: direction === "top" ? 0 : fallbackHeight,
      behavior: "smooth",
    });
  }, []);

  const isShareAvailable = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof window !== "undefined",
    []
  );

  const captureSceneBlob = useCallback(async (): Promise<Blob> => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) {
      throw new Error("Snapshot viewport is not mounted.");
    }

    const dataUrl = await captureVisible(viewportEl);
    return dataUrlToBlob(dataUrl);
  }, []);

  const captureScene = useCallback(async () => {
    setStatus("capturing");
    setError(null);

    try {
      const blob = await captureSceneBlob();

      const clipboardSupported =
        typeof navigator !== "undefined" &&
        typeof navigator.clipboard?.write === "function" &&
        typeof ClipboardItem !== "undefined";

      if (clipboardSupported) {
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);
        setStatus("copied");
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `stackflow-snapshot-${Date.now()}.png`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
      setStatus("downloaded");
    } catch (captureError) {
      console.error(captureError);
      setStatus("error");
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Unexpected capture error."
      );
    }
  }, [captureSceneBlob]);

  const shareScene = useCallback(async () => {
    if (!isShareAvailable) {
      setStatus("error");
      setError("Navigation share API is unavailable.");
      return;
    }

    setStatus("capturing");
    setError(null);

    try {
      const blob = await captureSceneBlob();
      const snapshotFile = new File(
        [blob],
        `stackflow-snapshot-${Date.now()}.png`,
        {
          type: blob.type,
        }
      );
      const shareFiles = [snapshotFile];
      const shareData: ShareData = {
        files: shareFiles,
        title: "Stackflow Snapshot",
        text: "Captured from the Stackflow Snapshot Studio",
      };

      if (
        typeof navigator.canShare === "function" &&
        !navigator.canShare({ files: shareFiles })
      ) {
        throw new Error("Share target does not support file payloads.");
      }

      await navigator.share(shareData);
      setStatus("shared");
    } catch (captureError) {
      console.error(captureError);
      setStatus("error");
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Unexpected capture error."
      );
    }
  }, [captureSceneBlob, isShareAvailable]);

  const statusCopy = buildStatusCopy(status, error);
  const statusClass =
    status === "copied" || status === "shared"
      ? "snapshot-controls__status--success"
      : status === "error"
      ? "snapshot-controls__status--error"
      : undefined;
  const captureLabel =
    status === "capturing" ? "Rendering…" : "Capture current view";

  return (
    <AppScreen appBar={{ title: "Screenshot Lab" }}>
      <div ref={viewportRef} className="snapshot-scroll-container">
        <div className="snapshot-activity">
          <section className="snapshot-hero">
            <div className="snapshot-hero__heading">
              <h1>Stackflow Snapshot Studio</h1>
              <p>
                Flex-heavy surface with deep scroll to validate render behavior
                and clipboard captures.
              </p>
            </div>
            <div className="snapshot-hero__metrics">
              {labMetricSource.map((metric) => (
                <article key={metric.label} className="snapshot-hero__metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="snapshot-controls">
            <div className="snapshot-controls__actions">
              <button
                type="button"
                onClick={captureScene}
                disabled={status === "capturing"}
              >
                {captureLabel}
              </button>
              {isShareAvailable && (
                <button
                  type="button"
                  onClick={shareScene}
                  disabled={status === "capturing"}
                >
                  Share snapshot
                </button>
              )}
              <button type="button" onClick={() => scrollViewport("top")}>
                Scroll to top
              </button>
              <button type="button" onClick={() => scrollViewport("bottom")}>
                Scroll to bottom
              </button>
            </div>
            <p className={`snapshot-controls__status ${statusClass ?? ""}`}>
              {statusCopy}
            </p>
          </section>

          <section className="snapshot-grid">
            {gridCards.map((card) => (
              <article key={card.title} className="snapshot-grid__card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ul className="snapshot-grid__list">
                  {card.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="snapshot-scroll-rail">
            {scrollRailExperiments.map((title, index) => (
              <article key={title} className="snapshot-scroll-card">
                <span>Rail #{index + 1}</span>
                <strong>{title}</strong>
                <span>
                  {index % 2 === 0
                    ? "GPU compositing engaged."
                    : "CPU paints to texture."}
                </span>
              </article>
            ))}
          </section>

          <section className="snapshot-charts">
            {chartData.map((datum) => (
              <article key={datum.label} className="snapshot-chart">
                <div className="snapshot-chart__bars">
                  <div
                    className="snapshot-chart__bar"
                    style={{ height: `${datum.value + 20}px` }}
                  />
                </div>
                <p className="snapshot-chart__label">{datum.label}</p>
              </article>
            ))}
          </section>

          <section className="snapshot-log">
            <header>
              <h3>Scroll marathon log</h3>
              <p>Use this to observe scroll retention between pushes.</p>
            </header>
            <ul className="snapshot-log__list">
              {logEntries.map((entry) => (
                <li key={entry.id} className="snapshot-log__entry">
                  <span className="snapshot-log__timestamp">
                    {entry.timestamp}
                  </span>
                  <span className="snapshot-log__message">{entry.message}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <button
        type="button"
        className="snapshot-floating-button"
        onClick={shareScene}
        disabled={status === "capturing"}
      >
        {captureLabel}
      </button>
    </AppScreen>
  );
};

export default SnapshotActivity;
