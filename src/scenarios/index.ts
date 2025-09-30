import type { ScenarioBlueprint, ScenarioElement } from "../components/ScenarioPanel.types";

import rawData from "./defaultScenarios.json";

type ScenarioElementJson = ScenarioElement;

type ScenarioActivityJson = {
  id: string;
  stageName: string;
  activityTitle: string;
  elements: ScenarioElementJson[];
};

type ScenarioEntryJson = {
  activityId: string;
  params?: Record<string, unknown>;
};

type ScenarioJson = {
  id: string;
  title: string;
  description: string;
  flagLabel: string;
  entry: ScenarioEntryJson;
  activities: ScenarioActivityJson[];
};

type ScenarioFile = {
  scenarios: ScenarioJson[];
};

const data = rawData as ScenarioFile;

const buildActivityRouteName = (scenarioId: string, activityId: string) =>
  `${scenarioId}::${activityId}`;

type ScenarioDefinition = ScenarioBlueprint & {
  entry: {
    activityId: string;
    activityName: string;
    params?: Record<string, unknown>;
  };
};

const scenarioDefinitions: ScenarioDefinition[] = data.scenarios.map((scenario) => {
  const activities: ScenarioBlueprint["activities"] = scenario.activities.map((activity) => ({
    id: activity.id,
    activityName: buildActivityRouteName(scenario.id, activity.id),
    stageName: activity.stageName ?? "Flow Stage",
    activityTitle: activity.activityTitle,
    elements: activity.elements,
  }));

  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    flagLabel: scenario.flagLabel,
    activities,
    entry: {
      activityId: scenario.entry.activityId,
      activityName: buildActivityRouteName(
        scenario.id,
        scenario.entry.activityId,
      ),
      params: scenario.entry.params,
    },
  };
});

export type { ScenarioDefinition };
export { buildActivityRouteName, scenarioDefinitions };
