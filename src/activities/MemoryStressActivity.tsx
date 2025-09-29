import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import {
  buildGraduallyMB,
  getHeavyPayloadStack,
  popHeavyPayload,
  pushHeavyPayloadMB,
  startHeapLogger,
  type GradualBuildOptions,
  type HeavyPayload,
} from "../lib/memoryOverload";

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_PAYLOAD_MB = 5;
const DEFAULT_EXTRA_MB = 10;

export type MemoryStressActivityParams = {
  payloadMB?: number;
  label?: string;
  mode?: GradualBuildOptions["mode"];
  chunkKB?: number;
};

const payloadSizeMB = (payload: HeavyPayload) => {
  if (payload.kind === "heavy") {
    return payload.approxBytes / BYTES_PER_MB;
  }
  return payload.buffer.byteLength / BYTES_PER_MB;
};

const MemoryStressActivity: ActivityComponentType<MemoryStressActivityParams> = ({ params }) => {
  const { push, pop } = useNavActions();
  const [stackSnapshot, setStackSnapshot] = useState<HeavyPayload[]>(() => [
    ...getHeavyPayloadStack(),
  ]);
  const [localPayloads, setLocalPayloads] = useState<HeavyPayload[]>([]);
  const [status, setStatus] = useState<"idle" | "allocating">("idle");
  const [progressMB, setProgressMB] = useState(0);
  const [heapMB, setHeapMB] = useState<number | null>(null);
  const payloadRef = useRef<HeavyPayload | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const payloadMB = params.payloadMB ?? DEFAULT_PAYLOAD_MB;
  const allocationLabel = params.label ?? `${payloadMB}MB payload`;
  const mode = params.mode ?? "heavy";
  const chunkKB = params.chunkKB;

  const refreshStackSnapshot = useCallback(() => {
    setStackSnapshot([...getHeavyPayloadStack()]);
  }, []);

  useEffect(() => {
    const handle = setInterval(refreshStackSnapshot, 1000);
    return () => clearInterval(handle);
  }, [refreshStackSnapshot]);

  useEffect(() => {
    const payload = pushHeavyPayloadMB(payloadMB, { mode, chunkKB });
    payloadRef.current = payload;
    refreshStackSnapshot();

    return () => {
      if (payloadRef.current) {
        popHeavyPayload();
        payloadRef.current = null;
      }
    };
  }, [chunkKB, mode, payloadMB, refreshStackSnapshot]);

  useEffect(() => {
    const stop = startHeapLogger({
      onSample: (sample) => {
        setHeapMB(sample.usedHeapMB ?? null);
      },
      logLabel: "heapMB",
    });
    return stop;
  }, []);

  const baseParams = useMemo(
    () => ({
      payloadMB,
      label: allocationLabel,
      mode,
      chunkKB,
    }),
    [payloadMB, allocationLabel, mode, chunkKB],
  );

  const stackDepth = stackSnapshot.length;
  const stackSizeMB = useMemo(
    () =>
      stackSnapshot.reduce((acc, item) => acc + payloadSizeMB(item), 0),
    [stackSnapshot],
  );

  const localSizeMB = useMemo(
    () => localPayloads.reduce((acc, item) => acc + payloadSizeMB(item), 0),
    [localPayloads],
  );

  const handlePushAnother = useCallback(
    (size: number) => {
      push("memory", {
        ...baseParams,
        payloadMB: size,
        label: `${size}MB payload`,
      });
    },
    [baseParams, push],
  );

  const handleAllocateExtra = useCallback(
    async (extraMB: number) => {
      if (status === "allocating") {
        return;
      }

      setStatus("allocating");
      setProgressMB(0);

      try {
        const payloads = await buildGraduallyMB(extraMB, {
          stepMB: Math.min(4, extraMB),
          chunkKB,
          mode,
          onProgress: (completedMB) => {
            if (mountedRef.current) {
              setProgressMB(completedMB);
            }
          },
          yieldMs: extraMB >= 8 ? 16 : 0,
        });

        if (mountedRef.current) {
          setLocalPayloads((prev) => [...prev, ...payloads]);
          setProgressMB(extraMB);
        }
      } finally {
        if (mountedRef.current) {
          setStatus("idle");
        }
      }
    },
    [chunkKB, mode, status],
  );

  const handleClearLocal = useCallback(() => {
    setLocalPayloads([]);
  }, []);

  const heapLabel = heapMB === null ? "N/A" : `${heapMB.toFixed(1)} MB`;
  const title = params.label ?? "Memory Stress";
  const resolvedPayload = payloadRef.current ?? stackSnapshot[stackDepth - 1] ?? null;
  const ownPayloadLabel = resolvedPayload ? payloadSizeMB(resolvedPayload).toFixed(2) : "0.00";

  return (
    <AppScreen
      appBar={{
        title,
        renderRight: () => (
          <button type="button" className="app-bar__action" onClick={() => push("memory", baseParams)}>
            복제
          </button>
        ),
      }}
    >
      <div className="activity">
        <section className="activity__header">
          <h1>{allocationLabel}</h1>
          <p>
            This screen holds approximately {ownPayloadLabel} MB from its own payload.
          </p>
        </section>

        <div className="activity__content">
          <section className="activity__card">
            <h2>Stack Overview</h2>
            <ul>
              <li>Stack depth: {stackDepth}</li>
              <li>Total stack payload: {stackSizeMB.toFixed(2)} MB</li>
              <li>Local extras (this screen): {localSizeMB.toFixed(2)} MB</li>
              <li>Heap usage (browser reported): {heapLabel}</li>
            </ul>
          </section>

          <section className="activity__card">
            <h2>Stack Actions</h2>
            <div className="activity__actions">
              <button type="button" onClick={() => push("text", {})}>
                Push text activity
              </button>
              <button type="button" onClick={() => handlePushAnother(payloadMB)}>
                Push another {payloadMB}MB screen
              </button>
              <button type="button" onClick={() => handlePushAnother(payloadMB * 2)}>
                Push heavier {payloadMB * 2}MB screen
              </button>
              <button type="button" onClick={() => handlePushAnother(DEFAULT_EXTRA_MB)}>
                Push {DEFAULT_EXTRA_MB}MB preset
              </button>
              <button type="button" onClick={() => pop()}>
                Pop current screen
              </button>
            </div>
          </section>

          <section className="activity__card">
            <h2>In-Screen Allocations</h2>
            <p>
              Allocate additional payloads retained by this screen to observe incremental heap growth without new screens.
            </p>
            <div className="activity__actions">
              <button
                type="button"
                disabled={status === "allocating"}
                onClick={() => handleAllocateExtra(DEFAULT_EXTRA_MB)}
              >
                {status === "allocating"
                  ? `Allocating... ${progressMB.toFixed(1)}MB`
                  : `Allocate +${DEFAULT_EXTRA_MB}MB`}
              </button>
              <button
                type="button"
                disabled={status === "allocating"}
                onClick={() => handleAllocateExtra(payloadMB)}
              >
                {status === "allocating" ? "Busy" : `Allocate +${payloadMB}MB`}
              </button>
              <button type="button" disabled={localPayloads.length === 0} onClick={handleClearLocal}>
                Release local payloads
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppScreen>
  );
};

export default MemoryStressActivity;
