import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScenarioPanel } from "./components/ScenarioPanel";
import type { ScenarioSummary } from "./components/ScenarioPanel";
import type { ScenarioBlueprint } from "./components/ScenarioPanel.types";
import { StackDevtoolsPanel } from "./components/StackDevtoolsPanel";
import { StackViewportPanel } from "./components/StackViewportPanel";
import { ScenarioWorkspace } from "./components/ScenarioWorkspace";
import { type StackRouteConfig, getFlowActions } from "./lib/NFXStack";
import type {
  DevtoolsDataStore,
  DevtoolsMessage,
} from "@stackflow/plugin-devtools";
import type { NavFlag } from "./hooks/useNavActions";
import { NAV_FLAG_INTERNAL_FIELD } from "./plugins/navFlagPlugin";
import { scenarioHistoryStore } from "./stores/useScenarioHistoryStore";
import { scenarioDefinitions } from "./scenarios";
import { createScenarioActivityComponent } from "./runtime/ScenarioActivity";
import { ScenarioRegistryProvider } from "./runtime/ScenarioRegistry";

const DEFAULT_VIEWPORT = {
  width: 420,
  height: 760,
};

const MIN_VIEWPORT = {
  width: 280,
  height: 480,
};

const MAX_VIEWPORT = {
  width: 1280,
  height: 1200,
};

type FlowActions = NonNullable<ReturnType<typeof getFlowActions>>;

type ScenarioBlueprintWithPush = ScenarioBlueprint<
  Parameters<FlowActions["push"]>[1],
  Parameters<FlowActions["push"]>[2]
>;

type ScenarioEntry = {
  activityName: Parameters<FlowActions["push"]>[0];
  params?: Parameters<FlowActions["push"]>[1];
};

type Scenario = ScenarioBlueprintWithPush & {
  entry: ScenarioEntry;
  run?: (
    actions: FlowActions,
    helpers: {
      queue: (cb: () => void, delay: number) => void;
    }
  ) => void;
};

const pushWithFlag = (
  actions: FlowActions,
  activityName: Parameters<FlowActions["push"]>[0],
  params: Parameters<FlowActions["push"]>[1],
  navFlag?: NavFlag,
  options?: Parameters<FlowActions["push"]>[2]
) => {
  const payload = navFlag
    ? ({
        ...(params as Record<string, unknown>),
        [NAV_FLAG_INTERNAL_FIELD]: navFlag,
      } as Parameters<FlowActions["push"]>[1])
    : params;

  return actions.push(activityName, payload, options);
};

const resetStackToEntry = (actions: FlowActions, entry: ScenarioEntry) => {
  const entryParams =
    entry.params ?? ({} as Parameters<FlowActions["push"]>[1]);

  // Use CLEAR_STACK via navFlag plugin to ensure the stack is fully reset
  // before pushing the entry activity. This avoids relying on pop(count).
  pushWithFlag(
    actions,
    entry.activityName,
    entryParams,
    { flag: "CLEAR_STACK" } as NavFlag,
    { animate: false }
  );
};

const useStackflowDevtoolsData = () => {
  const [data, setData] = useState<DevtoolsDataStore | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.__STACKFLOW_DEVTOOLS__?.data ?? null;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const read = () => {
      const hook = window.__STACKFLOW_DEVTOOLS__;
      if (hook) {
        setData({ ...hook.data });
      }
    };

    read();

    const handler = (event: MessageEvent<unknown>) => {
      if (
        event.source !== window ||
        typeof event.data !== "object" ||
        event.data === null
      ) {
        return;
      }

      const message = event.data as DevtoolsMessage;
      if (message.type === "DATA_CHANGED") {
        read();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return data;
};

const App = () => {
  const devtoolsData = useStackflowDevtoolsData();
  const [actions, setActions] = useState<FlowActions | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(
    null
  );
  const [workspaceScenarioId, setWorkspaceScenarioId] = useState<string | null>(
    null
  );
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const resolved = getFlowActions();
    if (resolved) {
      setActions(resolved);
    }
  }, []);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    },
    []
  );

  const queueTimeout = useCallback((cb: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      cb();
      timeoutsRef.current = timeoutsRef.current.filter(
        (stored) => stored !== id
      );
    }, delay);
    timeoutsRef.current.push(id);
  }, []);

  const baseScenarios = useMemo<Scenario[]>(
    () =>
      scenarioDefinitions.map(
        (scenario): Scenario => ({
          ...scenario,
          run: undefined,
        })
      ),
    []
  );

  const [scenarioMetaOverrides, setScenarioMetaOverrides] = useState<
    Record<string, { title: string; description: string }>
  >({});

  const scenarios = useMemo<Scenario[]>(
    () =>
      baseScenarios.map((scenario) => {
        const meta = scenarioMetaOverrides[scenario.id];
        if (!meta) {
          return scenario;
        }

        return {
          ...scenario,
          title: meta.title,
          description: meta.description,
        };
      }),
    [baseScenarios, scenarioMetaOverrides]
  );

  const scenarioBlueprints = useMemo<ScenarioBlueprintWithPush[]>(() => {
    return scenarios.map((scenario) => {
      const { run: _run, entry: _entry, ...blueprint } = scenario;
      void _run;
      void _entry;
      return blueprint;
    });
  }, [scenarios]);

  const scenarioSummaries = useMemo<ScenarioSummary[]>(
    () =>
      scenarioBlueprints.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
      })),
    [scenarioBlueprints]
  );

  const stackRoutes = useMemo<StackRouteConfig[]>(() => {
    const routes: StackRouteConfig[] = [];
    let initialAssigned = false;

    scenarios.forEach((scenario) => {
      scenario.activities.forEach((activity) => {
        const isInitial =
          !initialAssigned &&
          scenario.entry.activityName === activity.activityName;
        if (isInitial) {
          initialAssigned = true;
        }

        routes.push({
          name: activity.activityName,
          activity: createScenarioActivityComponent({
            scenarioId: scenario.id,
            activityId: activity.id,
          }),
          route: {
            path: `/${scenario.id}/${activity.id}`,
          },
          initial: isInitial,
        });
      });
    });

    return routes;
  }, [scenarios]);

  const handleScenarioMetaUpdate = useCallback(
    (scenarioId: string, meta: { title: string; description: string }) => {
      setScenarioMetaOverrides((prev) => {
        const base = baseScenarios.find(
          (scenario) => scenario.id === scenarioId
        );
        const isSameAsBase =
          base?.title === meta.title && base?.description === meta.description;
        if (isSameAsBase) {
          if (!prev[scenarioId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[scenarioId];
          return next;
        }

        const existing = prev[scenarioId];
        if (
          existing &&
          existing.title === meta.title &&
          existing.description === meta.description
        ) {
          return prev;
        }

        return {
          ...prev,
          [scenarioId]: meta,
        };
      });
    },
    [baseScenarios]
  );

  const handleScenarioRun = useCallback(
    (scenarioId: string) => {
      if (!actions) {
        return;
      }

      const scenario = scenarios.find(
        (candidate) => candidate.id === scenarioId
      );
      if (!scenario) {
        return;
      }

      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];

      resetStackToEntry(actions, scenario.entry);
      setRunningScenarioId(scenario.id);
      scenario.run?.(actions, { queue: queueTimeout });
      scenarioHistoryStore.getState().recordRun({
        id: scenario.id,
        title: scenario.title,
        runAt: Date.now(),
      });
      queueTimeout(() => {
        setRunningScenarioId((current) =>
          current === scenario.id ? null : current
        );
      }, 1200);
      setActiveScenario(scenario.id);
    },
    [actions, queueTimeout, scenarios]
  );

  const workspaceScenario = useMemo(
    () =>
      workspaceScenarioId
        ? scenarioBlueprints.find(
            (scenario) => scenario.id === workspaceScenarioId
          ) ?? null
        : null,
    [scenarioBlueprints, workspaceScenarioId]
  );

  return (
    <ScenarioRegistryProvider scenarios={scenarios}>
      {workspaceScenario ? (
        <ScenarioWorkspace
          scenario={workspaceScenario}
          onClose={() => setWorkspaceScenarioId(null)}
          onRun={() => handleScenarioRun(workspaceScenario.id)}
          isActionsReady={Boolean(actions)}
          isRunning={runningScenarioId === workspaceScenario.id}
          onUpdateScenarioMeta={(meta) =>
            handleScenarioMetaUpdate(workspaceScenario.id, meta)
          }
        />
      ) : (
        <div className="app-shell">
          <ScenarioPanel
            scenarios={scenarioSummaries}
            activeScenarioId={activeScenario}
            runningScenarioId={runningScenarioId}
            onRunScenario={handleScenarioRun}
            onOpenScenario={setWorkspaceScenarioId}
            isActionsReady={Boolean(actions)}
          />

          <StackViewportPanel
            routes={stackRoutes}
            defaultSize={DEFAULT_VIEWPORT}
            minSize={MIN_VIEWPORT}
            maxSize={MAX_VIEWPORT}
          />

          <StackDevtoolsPanel data={devtoolsData} />
        </div>
      )}
    </ScenarioRegistryProvider>
  );
};

export default App;
