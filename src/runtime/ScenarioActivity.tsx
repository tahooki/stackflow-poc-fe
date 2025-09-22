import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";
import { useMemo } from "react";

import type {
  ScenarioElement,
  ScenarioElementNavigate,
} from "../components/ScenarioPanel.types";
import { useNavActions, type PushOptionsExt } from "../hooks/useNavActions";
import { buildActivityRouteName } from "../scenarios";
import { useScenarioRegistry } from "./ScenarioRegistry";

type ScenarioActivityFactoryArgs = {
  scenarioId: string;
  activityId: string;
};

type ScenarioActivityParams = Record<string, unknown>;

const normalizeNavFlag = (
  scenarioId: string,
  navFlag: ScenarioElementNavigate["params"]["navFlag"],
) => {
  if (!navFlag) {
    return undefined;
  }

  if ("activity" in navFlag && navFlag.activity) {
    return {
      ...navFlag,
      activity: buildActivityRouteName(scenarioId, navFlag.activity),
    } as ScenarioElementNavigate["params"]["navFlag"];
  }

  return navFlag;
};

export const createScenarioActivityComponent = ({
  scenarioId,
  activityId,
}: ScenarioActivityFactoryArgs): ActivityComponentType<ScenarioActivityParams> => {
  const ScenarioRuntimeActivity: ActivityComponentType<ScenarioActivityParams> = () => {
    const registry = useScenarioRegistry();
    const { push } = useNavActions();
    const scenario = registry.getScenario(scenarioId);
    const activity = registry.getActivity(scenarioId, activityId);

    const activityElements = useMemo(() => activity?.elements ?? [], [activity]);

    if (!scenario || !activity) {
      return (
        <AppScreen appBar={{ title: "Scenario Activity" }}>
          <div className="runtime-activity runtime-activity--error">
            <p>등록된 시나리오 정보를 찾을 수 없습니다.</p>
          </div>
        </AppScreen>
      );
    }

    const handleNavigate = (element: ScenarioElementNavigate) => {
      const targetId = element.params.targetActivityId.trim();
      if (!targetId) {
        return;
      }

      const targetRoute = buildActivityRouteName(scenarioId, targetId);
      const normalizedNavFlag = normalizeNavFlag(
        scenarioId,
        element.params.navFlag,
      );
      const baseOptions = (element.params.options ?? {}) as PushOptionsExt;
      const pushOptions = normalizedNavFlag
        ? { ...baseOptions, navFlag: normalizedNavFlag }
        : baseOptions.navFlag
        ? { ...baseOptions, navFlag: baseOptions.navFlag }
        : Object.keys(baseOptions).length > 0
        ? baseOptions
        : undefined;

      push(
        targetRoute,
        (element.params.params ?? {}) as Parameters<typeof push>[1],
        pushOptions,
      );
    };

    const renderElement = (element: ScenarioElement) => {
      switch (element.type) {
        case "text": {
          const tone = element.params.tone ?? "default";
          return (
            <div key={element.id} className={`runtime-element runtime-element--text runtime-element--${tone}`}>
              <p>{element.params.body}</p>
            </div>
          );
        }
        case "navigate": {
          const isDisabled = !element.params.targetActivityId.trim();
          return (
            <div key={element.id} className="runtime-element runtime-element--navigate">
              <button
                type="button"
                onClick={() => handleNavigate(element)}
                disabled={isDisabled}
              >
                {element.params.label}
              </button>
              {element.params.flagBadge ? (
                <span className="runtime-element__badge">{element.params.flagBadge}</span>
              ) : null}
            </div>
          );
        }
        case "modal":
        case "bottomSheet": {
          return (
            <div key={element.id} className="runtime-element runtime-element--overlay">
              <strong>{element.params.label}</strong>
              <p>{element.params.description}</p>
            </div>
          );
        }
        default:
          return null;
      }
    };

    return (
      <AppScreen appBar={{ title: activity.activityTitle }}>
        <section className="runtime-activity">
          <header className="runtime-activity__header">
            <span className="runtime-activity__eyebrow">{scenario.flagLabel}</span>
            <h1>{activity.activityTitle}</h1>
            <p>{scenario.description}</p>
          </header>
          <div className="runtime-activity__body">
            {activityElements.length === 0 ? (
              <p className="runtime-activity__empty">구성 요소가 없습니다.</p>
            ) : (
              activityElements.map((element) => renderElement(element))
            )}
          </div>
        </section>
      </AppScreen>
    );
  };

  ScenarioRuntimeActivity.displayName = `ScenarioActivity(${scenarioId}/${activityId})`;

  return ScenarioRuntimeActivity;
};
