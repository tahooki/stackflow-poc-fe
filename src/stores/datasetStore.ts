import { create } from "zustand";
import type { StateCreator } from "zustand";

import { getWaferDatasetMeta } from "../lib/waferDataset";

export type DatasetState = {
  recordCount: number;
  maxRecords: number;
  setRecordCount: (next: number) => void;
};

const clampRecordCount = (value: number) => {
  const { size } = getWaferDatasetMeta();
  const normalized = Number.isFinite(value) ? Math.floor(value) : size;
  return Math.min(Math.max(normalized, 1), size);
};

const createDatasetStore: StateCreator<DatasetState> = (set) => {
  const { size } = getWaferDatasetMeta();

  return {
    recordCount: 100,
    maxRecords: size,
    setRecordCount: (next) => {
      const clamped = clampRecordCount(next);
      const latest = getWaferDatasetMeta().size;
      set({
        recordCount: Math.min(clamped, latest),
        maxRecords: latest,
      });
    },
  };
};

export const useDatasetStore = create<DatasetState>(createDatasetStore);
