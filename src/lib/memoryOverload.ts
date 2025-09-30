/*
 * Helpers for generating large in-memory payloads to stress the JS heap.
 * Crafting object+string graphs keeps references alive so GC cannot reclaim them easily.
 */

const PRINTABLE_ASCII_RANGE = 95;
const PRINTABLE_ASCII_OFFSET = 32;
const HEAVY_ITEM_OVERHEAD_BYTES = 12;

const fillRandomBytes = (() => {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    return (array: Uint8Array) => globalThis.crypto.getRandomValues(array);
  }
  return (array: Uint8Array) => {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
  };
})();

export const makeRandomString = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  const array = new Uint8Array(bytes);
  fillRandomBytes(array);

  let result = "";
  for (let i = 0; i < array.length; i += 1) {
    result += String.fromCharCode(
      PRINTABLE_ASCII_OFFSET + (array[i] % PRINTABLE_ASCII_RANGE),
    );
  }
  return result;
};

export interface HeavyStringItem {
  id: number;
  data: string;
}

export interface HeavyObjectPayload {
  kind: "heavy";
  items: HeavyStringItem[];
  approxBytes: number;
}

export interface BinaryPayload {
  kind: "bin";
  buffer: Uint8Array;
}

export type HeavyPayload = HeavyObjectPayload | BinaryPayload;

const toBytes = (mb: number) => Math.floor(mb * 1024 * 1024);
const toChunkBytes = (kb: number) => Math.max(1, Math.floor(kb * 1024));

export const makeHeavyObjectMB = (
  targetMB: number,
  chunkKB = 16,
): HeavyObjectPayload => {
  if (!Number.isFinite(targetMB) || targetMB <= 0) {
    throw new RangeError("targetMB must be > 0");
  }

  const targetBytes = toBytes(targetMB);
  const chunkBytes = toChunkBytes(chunkKB);
  const items: HeavyStringItem[] = [];

  let approxBytes = 0;
  let id = 0;

  while (approxBytes < targetBytes) {
    const data = makeRandomString(chunkBytes);
    items.push({ id, data });
    approxBytes += chunkBytes + HEAVY_ITEM_OVERHEAD_BYTES;
    id += 1;
  }

  return {
    kind: "heavy",
    items,
    approxBytes,
  };
};

export const makeBinaryPayloadMB = (targetMB: number): BinaryPayload => {
  if (!Number.isFinite(targetMB) || targetMB <= 0) {
    throw new RangeError("targetMB must be > 0");
  }

  const buffer = new Uint8Array(toBytes(targetMB));
  buffer.fill(1);

  return {
    kind: "bin",
    buffer,
  };
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface GradualBuildOptions {
  stepMB?: number;
  chunkKB?: number;
  mode?: "heavy" | "binary";
  onProgress?: (completedMB: number) => void;
  yieldMs?: number | null;
}

export const buildGraduallyMB = async (
  totalMB: number,
  options?: GradualBuildOptions,
): Promise<HeavyPayload[]> => {
  if (!Number.isFinite(totalMB) || totalMB <= 0) {
    throw new RangeError("totalMB must be > 0");
  }

  const stepMB = options?.stepMB ?? 1;
  if (!Number.isFinite(stepMB) || stepMB <= 0) {
    throw new RangeError("stepMB must be > 0");
  }

  const yieldMs = options?.yieldMs ?? 0;
  const payloads: HeavyPayload[] = [];

  for (let producedMB = 0; producedMB < totalMB; producedMB += stepMB) {
    const remainingMB = Math.min(stepMB, totalMB - producedMB);
    const payload =
      options?.mode === "binary"
        ? makeBinaryPayloadMB(remainingMB)
        : makeHeavyObjectMB(remainingMB, options?.chunkKB);

    payloads.push(payload);
    options?.onProgress?.(Math.min(totalMB, producedMB + remainingMB));

    if (yieldMs !== null) {
      // Yield to the event loop to avoid long tasks when accumulating payloads.
      await delay(Math.max(0, yieldMs));
    }
  }

  return payloads;
};

const heavyPayloadStack: HeavyPayload[] = [];

export const pushHeavyPayloadMB = (
  targetMB: number,
  options?: { chunkKB?: number; mode?: "heavy" | "binary" },
): HeavyPayload => {
  const payload =
    options?.mode === "binary"
      ? makeBinaryPayloadMB(targetMB)
      : makeHeavyObjectMB(targetMB, options?.chunkKB);

  heavyPayloadStack.push(payload);
  return payload;
};

export const pushHeavyPayload = (payload: HeavyPayload): number => {
  heavyPayloadStack.push(payload);
  return heavyPayloadStack.length;
};

export const popHeavyPayload = (): HeavyPayload | undefined => heavyPayloadStack.pop();

export const clearHeavyPayloadStack = (): void => {
  heavyPayloadStack.length = 0;
};

export const getHeavyPayloadStack = (): readonly HeavyPayload[] => heavyPayloadStack;

interface PerformanceMemoryLike {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

type HeapSample = {
  usedHeapMB: number | null;
  raw?: PerformanceMemoryLike;
};

export interface HeapLoggerOptions {
  intervalMs?: number;
  onSample?: (sample: HeapSample) => void;
  logLabel?: string;
}

export const startHeapLogger = (options?: HeapLoggerOptions): (() => void) => {
  const intervalMs = options?.intervalMs ?? 1000;

  const sample = () => {
    const perf: Performance | undefined = typeof performance !== "undefined" ? performance : undefined;
    const memory = perf ? (perf as Performance & { memory?: PerformanceMemoryLike }).memory : undefined;

    if (memory && typeof memory.usedJSHeapSize === "number") {
      const usedHeapMB = memory.usedJSHeapSize / (1024 * 1024);
      options?.onSample?.({ usedHeapMB, raw: memory });
      if (!options?.onSample) {
        console.log(options?.logLabel ?? "heapMB", Math.round(usedHeapMB));
      }
    } else {
      options?.onSample?.({ usedHeapMB: null });
      if (!options?.onSample) {
        console.log(options?.logLabel ?? "heapMB", "N/A");
      }
    }
  };

  sample();
  const handle = setInterval(sample, intervalMs);
  return () => clearInterval(handle);
};
