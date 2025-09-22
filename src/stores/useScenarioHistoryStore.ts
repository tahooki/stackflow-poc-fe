import { create } from "zustand";

export type ScenarioRunRecord = {
  id: string;
  title: string;
  runAt: number;
};

export type ScenarioHistoryStore = {
  runs: ScenarioRunRecord[];
  recordRun: (record: ScenarioRunRecord) => void;
  clear: () => void;
  getRunCount: (scenarioId?: string) => number;
};

export const useScenarioHistoryStore = create<ScenarioHistoryStore>((set, get) => ({
  runs: [],
  recordRun: (record) => {
    set((state) => ({ runs: [...state.runs, record] }));
  },
  clear: () => set({ runs: [] }),
  getRunCount: (scenarioId) => {
    const { runs } = get();
    if (!scenarioId) {
      return runs.length;
    }
    return runs.filter((run) => run.id === scenarioId).length;
  },
}));

export const scenarioHistoryStore = {
  getState: useScenarioHistoryStore.getState,
  setState: useScenarioHistoryStore.setState,
  subscribe: useScenarioHistoryStore.subscribe,
};
