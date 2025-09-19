import { memo } from "react";

type ScenarioCard = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  flagLabel: string;
};

type ScenarioPanelProps = {
  scenarios: ReadonlyArray<ScenarioCard>;
  activeScenarioId: string | null;
  onRunScenario: (scenarioId: string) => void;
  isActionsReady: boolean;
};

const ScenarioPanelComponent = ({
  scenarios,
  activeScenarioId,
  onRunScenario,
  isActionsReady,
}: ScenarioPanelProps) => (
  <section className="panel scenario-panel">
    <header className="panel__header">
      <h2>시나리오 보드</h2>
      <span className="panel__meta">
        NAV 플래그 케이스와 상태 유지 흐름을 빠르게 실행합니다.
      </span>
    </header>
    <ul className="scenario-list">
      {scenarios.map((scenario) => {
        const isActive = activeScenarioId === scenario.id;

        return (
          <li
            key={scenario.id}
            className={
              isActive
                ? "scenario-card scenario-card--active"
                : "scenario-card"
            }
          >
            <div>
              <span className="scenario-card__flag">{scenario.flagLabel}</span>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
              <ul className="scenario-card__steps">
                {scenario.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onRunScenario(scenario.id)}
              disabled={!isActionsReady}
            >
              실행
            </button>
          </li>
        );
      })}
    </ul>
  </section>
);

export const ScenarioPanel = memo(ScenarioPanelComponent);

export type { ScenarioCard };
