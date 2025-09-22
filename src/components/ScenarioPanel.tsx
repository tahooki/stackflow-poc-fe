import { memo } from "react";

import type { ScenarioBlueprint } from "./ScenarioPanel.types";

type ScenarioSummary = Pick<ScenarioBlueprint, "id" | "title" | "description">;

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
            data-running={isRunning ? "true" : undefined}
          >
            <div className="scenario-card__compact-body">
              <div className="scenario-card__header">
                <button
                  type="button"
                  className="scenario-card__header-main"
                  onClick={() => onRunScenario(scenario.id)}
                >
                  <span className="scenario-card__index" aria-hidden>
                    {index + 1}
                  </span>
                  <h3>{scenario.title}</h3>
                </button>
                <button
                  type="button"
                  className="scenario-card__compact-edit"
                  onClick={() => onOpenScenario(scenario.id)}
                  aria-label="시나리오 편집"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden
                  >
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                      fill="currentColor"
                    />
                    <path
                      d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                className="scenario-card__content"
                onClick={() => onRunScenario(scenario.id)}
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
