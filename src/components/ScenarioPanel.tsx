import { memo } from "react";

import type { ScenarioBlueprint } from "./ScenarioPanel.types";

type ScenarioSummary = Pick<
  ScenarioBlueprint,
  "id" | "title" | "description"
>;

type ScenarioPanelProps = {
  scenarios: ReadonlyArray<ScenarioSummary>;
  activeScenarioId: string | null;
  runningScenarioId: string | null;
  onRunScenario: (scenarioId: string) => void;
  onOpenScenario: (scenarioId: string) => void;
  isActionsReady: boolean;
};

const ScenarioPanelComponent = ({
  scenarios,
  activeScenarioId,
  runningScenarioId,
  onRunScenario,
  onOpenScenario,
  isActionsReady,
}: ScenarioPanelProps) => (
  <section className="panel scenario-panel">
    <header className="panel__header">
      <h2>시나리오 보드</h2>
      <span className="panel__meta">
        NAV 플래그 케이스와 상태 유지 흐름을 빠르게 실행합니다.
      </span>
    </header>
    <ul className="scenario-list scenario-list--compact">
      {scenarios.map((scenario, index) => {
        const isActive = activeScenarioId === scenario.id;
        const isRunning = runningScenarioId === scenario.id;

        return (
          <li
            key={scenario.id}
            className={
              isActive
                ? "scenario-card scenario-card--compact scenario-card--active"
                : "scenario-card scenario-card--compact"
            }
          >
            <div className="scenario-card__compact-body">
              <div className="scenario-card__header">
                <button
                  type="button"
                  className="scenario-card__header-main"
                  onClick={() => onOpenScenario(scenario.id)}
                >
                  <span className="scenario-card__index" aria-hidden>
                    {index + 1}
                  </span>
                  <h3>{scenario.title}</h3>
                </button>
                <button
                  type="button"
                  className={
                    isRunning
                      ? "scenario-card__compact-run scenario-card__compact-run--running"
                      : "scenario-card__compact-run"
                  }
                  onClick={() => onRunScenario(scenario.id)}
                  disabled={!isActionsReady}
                >
                  {isRunning ? "실행중" : "실행"}
                </button>
              </div>
              <button
                type="button"
                className="scenario-card__content"
                onClick={() => onOpenScenario(scenario.id)}
              >
                <p>{scenario.description}</p>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  </section>
);

const ScenarioPanel = memo(ScenarioPanelComponent);

export { ScenarioPanel };
export type { ScenarioSummary };
