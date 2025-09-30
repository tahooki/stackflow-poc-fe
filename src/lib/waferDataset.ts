import TABLE_DATA, { type TableDataEntry } from "../assets/table_data";

const REPEAT_COUNT = 100;
const TARGET_SIZE = 10_000;

export type WaferRecord = TableDataEntry;

type DatasetMeta = {
  baseSize: number;
  repeatCount: number;
  size: number;
};

let cachedDataset: WaferRecord[] | null = null;
let cachedMeta: DatasetMeta | null = null;

const cloneRecord = (record: WaferRecord): WaferRecord => {
  if (typeof structuredClone === "function") {
    return structuredClone(record);
  }

  return JSON.parse(JSON.stringify(record)) as WaferRecord;
};

const buildTimestamp = (original: string, offsetMinutes: number) => {
  const base = Date.parse(original);

  if (Number.isNaN(base)) {
    return `${original}-${offsetMinutes}`;
  }

  const adjusted = base + offsetMinutes * 60_000;
  return new Date(adjusted).toISOString();
};

const buildDataset = (): WaferRecord[] => {
  const base = TABLE_DATA;
  const baseSize = base.length;

  if (baseSize === 0) {
    cachedMeta = { baseSize: 0, repeatCount: REPEAT_COUNT, size: 0 };
    return [];
  }

  const repeated: WaferRecord[] = [];

  for (let repeat = 0; repeat < REPEAT_COUNT; repeat += 1) {
    base.forEach((entry, index) => {
      const clone = cloneRecord(entry);
      const globalIndex = repeat * baseSize + index;

      repeated.push({
        ...clone,
        wafer_id: `${entry.wafer_id}-${repeat + 1}`,
        lot_id: `${entry.lot_id}-${String(repeat + 1).padStart(3, "0")}`,
        timestamp: buildTimestamp(entry.timestamp, globalIndex),
      });
    });
  }

  const normalized = repeated.slice(0, TARGET_SIZE);
  cachedMeta = {
    baseSize,
    repeatCount: REPEAT_COUNT,
    size: normalized.length,
  };
  return normalized;
};

export const initializeWaferDataset = (): DatasetMeta => {
  if (!cachedDataset) {
    cachedDataset = buildDataset();
  }
  return cachedMeta ?? {
    baseSize: TABLE_DATA.length,
    repeatCount: REPEAT_COUNT,
    size: cachedDataset.length,
  };
};

export const getWaferDatasetMeta = (): DatasetMeta => {
  if (!cachedDataset) {
    return initializeWaferDataset();
  }
  return cachedMeta!;
};

export const createWaferDatasetCopy = (limit?: number): WaferRecord[] => {
  if (!cachedDataset) {
    cachedDataset = buildDataset();
  }
  const sliceCount = (() => {
    if (typeof limit !== "number" || !Number.isFinite(limit)) {
      return cachedDataset.length;
    }
    return Math.min(Math.max(Math.floor(limit), 0), cachedDataset.length);
  })();
  return cachedDataset.slice(0, sliceCount).map(cloneRecord);
};
