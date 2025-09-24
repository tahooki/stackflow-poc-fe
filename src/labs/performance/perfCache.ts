import { useSyncExternalStore } from "react";

export type PerfCacheEntry = {
  activityId: string;
  label: string;
  data: Uint8Array;
  sizeMB: number;
  createdAt: number;
  lastAccessed: number;
};

type PerfCacheSnapshot = {
  entries: PerfCacheEntry[];
  totalMB: number;
};

type SummarySnapshot = {
  entryCount: number;
  totalMB: number;
};

class PerfCacheStore {
  private entries = new Map<string, PerfCacheEntry>();

  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  write(entry: PerfCacheEntry) {
    this.entries.set(entry.activityId, entry);
    this.emit();
  }

  touch(activityId: string) {
    const current = this.entries.get(activityId);
    if (!current) {
      return;
    }

    this.entries.set(activityId, {
      ...current,
      lastAccessed: Date.now(),
    });
    this.emit();
  }

  remove(activityId: string) {
    if (this.entries.delete(activityId)) {
      this.emit();
    }
  }

  clear() {
    if (this.entries.size === 0) {
      return;
    }

    this.entries.clear();
    this.emit();
  }

  evictTo(maxTotalMB: number) {
    let total = this.computeTotalMB();
    if (total <= maxTotalMB) {
      return;
    }

    const ordered = Array.from(this.entries.values()).sort(
      (a, b) => a.lastAccessed - b.lastAccessed,
    );

    for (const entry of ordered) {
      if (total <= maxTotalMB) {
        break;
      }

      this.entries.delete(entry.activityId);
      total -= entry.sizeMB;
    }

    this.emit();
  }

  getEntry(activityId: string) {
    return this.entries.get(activityId);
  }

  getSnapshot(): PerfCacheSnapshot {
    const entries = Array.from(this.entries.values()).sort(
      (a, b) => b.lastAccessed - a.lastAccessed,
    );
    return {
      entries,
      totalMB: this.computeTotalMB(),
    };
  }

  getSummary(): SummarySnapshot {
    return {
      entryCount: this.entries.size,
      totalMB: Number(this.computeTotalMB().toFixed(2)),
    };
  }

  private computeTotalMB() {
    let total = 0;
    this.entries.forEach((entry) => {
      total += entry.sizeMB;
    });
    return total;
  }
}

const store = new PerfCacheStore();

export const perfCacheStore = store;

export const registerCacheEntry = (
  activityId: string,
  label: string,
  data: Uint8Array,
) => {
  const sizeMB = data.byteLength / (1024 * 1024);
  const timestamp = Date.now();
  store.write({
    activityId,
    label,
    data,
    sizeMB,
    createdAt: timestamp,
    lastAccessed: timestamp,
  });
};

export const touchCacheEntry = (activityId: string) => {
  store.touch(activityId);
};

export const removeCacheEntry = (activityId: string) => {
  store.remove(activityId);
};

export const clearCache = () => {
  store.clear();
};

export const evictCacheTo = (maxTotalMB: number) => {
  store.evictTo(maxTotalMB);
};

export const usePerfCacheEntry = (activityId: string) =>
  useSyncExternalStore(store.subscribe, () => store.getEntry(activityId), () =>
    store.getEntry(activityId),
  );

export const usePerfCacheEntries = () =>
  useSyncExternalStore(store.subscribe, () => store.getSnapshot().entries, () =>
    store.getSnapshot().entries,
  );

export const usePerfCacheSummary = () =>
  useSyncExternalStore(store.subscribe, () => store.getSummary(), () =>
    store.getSummary(),
  );

export const getCacheTotalMB = () => store.getSummary().totalMB;
