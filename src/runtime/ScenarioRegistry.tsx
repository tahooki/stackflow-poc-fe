import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

import type {
  ScenarioActivity,
  ScenarioBlueprint,
} from "../components/ScenarioPanel.types";

type ScenarioRegistryValue = {
  scenarios: ReadonlyArray<ScenarioBlueprint>;
  getScenario: (scenarioId: string) => ScenarioBlueprint | undefined;
  getActivity: (
    scenarioId: string,
    activityId: string,
  ) => ScenarioActivity | undefined;
  getActivityByName: (
    activityName: string,
  ) => { scenarioId: string; activity: ScenarioActivity } | undefined;
};

const ScenarioRegistryContext = createContext<ScenarioRegistryValue | null>(null);

type ScenarioRegistryProviderProps = PropsWithChildren<{
  scenarios: ReadonlyArray<ScenarioBlueprint>;
}>;

export const ScenarioRegistryProvider = ({
  scenarios,
  children,
}: ScenarioRegistryProviderProps) => {
  const value = useMemo<ScenarioRegistryValue>(() => {
    const scenarioMap = new Map<string, ScenarioBlueprint>();
    const activityMap = new Map<string, { scenarioId: string; activity: ScenarioActivity }>();

    scenarios.forEach((scenario) => {
      scenarioMap.set(scenario.id, scenario);
      scenario.activities.forEach((activity) => {
        activityMap.set(activity.activityName, {
          scenarioId: scenario.id,
          activity,
        });
      });
    });

    return {
      scenarios,
      getScenario: (scenarioId) => scenarioMap.get(scenarioId),
      getActivity: (scenarioId, activityId) =>
        scenarioMap.get(scenarioId)?.activities.find((activity) => activity.id === activityId),
      getActivityByName: (activityName) => {
        const activity = activityMap.get(activityName);
        return activity;
      },
    };
  }, [scenarios]);

  return (
    <ScenarioRegistryContext.Provider value={value}>
      {children}
    </ScenarioRegistryContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useScenarioRegistry = () => {
  const context = useContext(ScenarioRegistryContext);
  if (!context) {
    throw new Error(
      "ScenarioRegistryContext is not available. Wrap the component tree with <ScenarioRegistryProvider>.",
    );
  }
  return context;
};
