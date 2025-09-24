import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useStack } from "@stackflow/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNavActions } from "../hooks/useNavActions";
import {
  registerCacheEntry,
  removeCacheEntry,
  touchCacheEntry,
  usePerfCacheEntry,
} from "../labs/performance/perfCache";

type Mode = "keep" | "cache";

type LabsPerformanceDetailParams = {
  id: string;
  mode: Mode;
  sizeMB?: number | string;
};

const clampSize = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 10;
  }

  return Math.max(1, Math.min(512, Math.floor(value)));
};

const createPayload = (sizeMB: number) => {
  const bytes = clampSize(sizeMB) * 1024 * 1024;
  const buffer = new Uint8Array(bytes);
  for (let index = 0; index < bytes; index += 1) {
    buffer[index] = index % 256;
  }
  return buffer;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) {
    return "0 bytes";
  }

  const mb = bytes / (1024 * 1024);
  return `${bytes.toLocaleString()} bytes (${mb.toFixed(2)} MB)`;
};

const LabsPerformanceDetailActivity: ActivityComponentType<LabsPerformanceDetailParams> = ({
  params,
}) => {
  const activity = useActivity();
  const activityId = activity.id;
  const stack = useStack();
  const { pop } = useNavActions();

  const mode: Mode = params.mode === "cache" ? "cache" : "keep";
  const sizeCandidate = typeof params.sizeMB === "string" ? Number(params.sizeMB) : params.sizeMB;
  const sizeMB = clampSize(sizeCandidate ?? 10);
  const label = useMemo(() => `detail-${params.id}`, [params.id]);

  const cachedEntry = usePerfCacheEntry(activityId);
  const touchedRef = useRef(false);
  const allowBootstrapRef = useRef(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localPayload, setLocalPayload] = useState<Uint8Array | null>(() =>
    mode === "keep" ? createPayload(sizeMB) : null,
  );

  useEffect(() => {
    if (mode !== "cache") {
      return;
    }

    if (!cachedEntry) {
      if (!allowBootstrapRef.current) {
        return;
      }

      setIsGenerating(true);
      const data = createPayload(sizeMB);
      registerCacheEntry(activityId, label, data);
      touchedRef.current = true;
      setIsGenerating(false);
      return;
    }

    if (!touchedRef.current) {
      touchCacheEntry(activityId);
      touchedRef.current = true;
    }
  }, [activityId, cachedEntry, label, mode, sizeMB]);

  const payload = mode === "keep" ? localPayload : cachedEntry?.data ?? null;
  const payloadPreview = useMemo(() => {
    if (!payload) {
      return "";
    }

    const sample = payload.slice(0, Math.min(24, payload.length));
    return Array.from(sample).join(", ");
  }, [payload]);

  const rebuildPayload = () => {
    if (mode === "keep") {
      setLocalPayload(createPayload(sizeMB));
      return;
    }

    const data = createPayload(sizeMB);
    registerCacheEntry(activityId, label, data);
    allowBootstrapRef.current = true;
    touchedRef.current = true;
  };

  const removeFromCache = () => {
    if (mode === "cache") {
      removeCacheEntry(activityId);
      allowBootstrapRef.current = false;
      touchedRef.current = false;
    }
  };

  return (
    <AppScreen appBar={{ title: `Perf Detail (${mode})` }}>
      <section className="activity__header">
        <h1>Performance Detail</h1>
        <p>
          Activity <strong>{activityId}</strong> using <strong>{mode}</strong> strategy with target size
          {" "}
          <strong>{sizeMB} MB</strong>.
        </p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Payload Status</h2>
          <p>Generation state: {isGenerating ? "building payload" : "idle"}</p>
          <p>Allocated: <strong>{formatBytes(payload?.byteLength ?? 0)}</strong></p>
          {payload && (
            <pre className="activity__code">{payloadPreview}</pre>
          )}
          <div className="activity__actions">
            <button type="button" onClick={() => pop()}>
              Pop activity
            </button>
            <button type="button" onClick={rebuildPayload}>
              Rebuild payload
            </button>
            {mode === "cache" && (
              <button type="button" onClick={removeFromCache}>
                Remove from cache
              </button>
            )}
          </div>
        </section>

        <section className="activity__card">
          <h2>Stack Snapshot</h2>
          <p>
            Stack depth: <strong>{stack.activities.length}</strong>
          </p>
          <ul className="activity__list">
            {stack.activities.map((item) => (
              <li key={item.id}>
                {item.name} — {item.id}
              </li>
            ))}
          </ul>
        </section>

        {mode === "cache" && (
          <section className="activity__card">
            <h2>Cache Metadata</h2>
            <p>
              Cache entry:{" "}
              {cachedEntry ? (
                <span>
                  created {new Date(cachedEntry.createdAt).toLocaleTimeString()} • last accessed {" "}
                  {new Date(cachedEntry.lastAccessed).toLocaleTimeString()}
                </span>
              ) : (
                <span>no cached data available</span>
              )}
            </p>
          </section>
        )}
      </div>
    </AppScreen>
  );
};

export default LabsPerformanceDetailActivity;
