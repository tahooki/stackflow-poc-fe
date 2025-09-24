import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useStack } from "@stackflow/react";
import { useMemo, useState } from "react";

import { useNavActions } from "../hooks/useNavActions";
import {
  clearCache,
  evictCacheTo,
  usePerfCacheEntries,
  usePerfCacheSummary,
} from "../labs/performance/perfCache";

const clampSize = (value: number, fallback: number, max = 512) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(max, Math.floor(value)));
};

const formatMB = (value: number) => `${value.toFixed(2)} MB`;

const generateRunId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const LabsPerformanceActivity: ActivityComponentType = () => {
  const { push } = useNavActions();
  const stack = useStack();
  const cacheSummary = usePerfCacheSummary();
  const cacheEntries = usePerfCacheEntries();

  const [keepSize, setKeepSize] = useState(10);
  const [cacheSize, setCacheSize] = useState(10);
  const [evictLimit, setEvictLimit] = useState(80);

  const stackNames = useMemo(
    () => stack.activities.map((activity) => `${activity.name} (${activity.id})`),
    [stack.activities],
  );

  return (
    <AppScreen appBar={{ title: "Labs: Performance" }}>
      <section className="activity__header">
        <h1>Performance Stress Playground</h1>
        <p>
          Compare Stackflow memory strategies by stacking heavy pages. Keep the component mounted
          or rely on a global cache and observe memory growth, GC pressure, and resume latency.
        </p>
      </section>

      <div className="activity__content">
        <section className="activity__card">
          <h2>Current Stack</h2>
          <p>
            Activities on stack: <strong>{stack.activities.length}</strong>
          </p>
          <ul className="activity__list">
            {stackNames.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>

        <section className="activity__card">
          <h2>Strategy A — Keep Components Mounted</h2>
          <p>
            Generates a large payload with <code>for</code> loops and stores it directly inside the
            activity&apos;s local state. Data stays in memory until the activity is popped.
          </p>
          <div className="activity__form">
            <label className="activity__field">
              <span>Payload size per push (MB)</span>
              <input
                type="number"
                min={1}
                max={512}
                step={1}
                value={keepSize}
                onChange={(event) =>
                  setKeepSize(clampSize(Number(event.target.value), keepSize))
                }
              />
            </label>
          </div>
          <div className="activity__actions">
            <button
              type="button"
              onClick={() =>
                push("LabsPerformanceDetail", {
                  id: generateRunId(),
                  mode: "keep",
                  sizeMB: keepSize,
                })
              }
            >
              Push heavy detail (keep mounted)
            </button>
          </div>
          <p className="activity__hint">
            Push repeatedly without popping to observe how memory increases as the stack grows.
          </p>
        </section>

        <section className="activity__card">
          <h2>Strategy B — Cache Only</h2>
          <p>
            The activity generates data once, stores it in a global cache keyed by <code>activityId</code>,
            then releases the component when popped. Use this to test cache reuse and eviction policies.
          </p>
          <div className="activity__form">
            <label className="activity__field">
              <span>Payload size per push (MB)</span>
              <input
                type="number"
                min={1}
                max={512}
                step={1}
                value={cacheSize}
                onChange={(event) =>
                  setCacheSize(clampSize(Number(event.target.value), cacheSize))
                }
              />
            </label>
            <label className="activity__field">
              <span>Evict down to (MB)</span>
              <input
                type="number"
                min={1}
                max={1024}
                step={1}
                value={evictLimit}
                onChange={(event) =>
                  setEvictLimit(clampSize(Number(event.target.value), evictLimit, 1024))
                }
              />
            </label>
          </div>
          <div className="activity__actions">
            <button
              type="button"
              onClick={() =>
                push("LabsPerformanceDetail", {
                  id: generateRunId(),
                  mode: "cache",
                  sizeMB: cacheSize,
                })
              }
            >
              Push heavy detail (cache only)
            </button>
            <button type="button" onClick={() => evictCacheTo(evictLimit)}>
              Evict to limit
            </button>
            <button type="button" onClick={() => clearCache()}>
              Clear cache
            </button>
          </div>
          <p className="activity__hint">
            Pop the activity and push it again to measure resume latency when reading from the cache.
          </p>
          <div className="activity__metrics">
            <p>
              Cache usage: <strong>{formatMB(cacheSummary.totalMB)}</strong> across
              <strong> {cacheSummary.entryCount}</strong> entries
            </p>
            <ul className="activity__list">
              {cacheEntries.length === 0 && <li>No cached entries yet.</li>}
              {cacheEntries.map((entry) => (
                <li key={entry.activityId}>
                  {entry.label} • {formatMB(entry.sizeMB)} • last accessed {" "}
                  {new Date(entry.lastAccessed).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="activity__card">
          <h2>Measurement Tips</h2>
          <ul className="activity__list">
            <li>Android Chrome: open DevTools &rarr; Memory panel for rough heap usage.</li>
            <li>Measure resume latency by counting the time between push/back and first paint.</li>
            <li>
              Keep an eye on FPS/Long Task overlays to understand GC pressure as cache size increases.
            </li>
          </ul>
        </section>
      </div>
    </AppScreen>
  );
};

export default LabsPerformanceActivity;
