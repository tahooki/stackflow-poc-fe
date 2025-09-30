import {
  scenarioHistoryStore,
  type ScenarioRunRecord,
} from "../stores/useScenarioHistoryStore";

export const resetScenarioHistory = () => {
  scenarioHistoryStore.getState().clear();
};

export const getScenarioHistory = (): ScenarioRunRecord[] => {
  return scenarioHistoryStore.getState().runs;
};

export const getScenarioRunCount = (scenarioId?: string) => {
  return scenarioHistoryStore.getState().getRunCount(scenarioId);
};
