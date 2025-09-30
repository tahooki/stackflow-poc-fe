import "@stackflow/plugin-basic-ui/index.css";
import "../App.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScenarioPanel } from "../components/ScenarioPanel";
import type { ScenarioSummary } from "../components/ScenarioPanel";
import type { ScenarioBlueprint } from "../components/ScenarioPanel.types";
import { StackDevtoolsPanel } from "../components/StackDevtoolsPanel";
import { StackViewportPanel } from "../components/StackViewportPanel";
import { ScenarioWorkspace } from "../components/ScenarioWorkspace";
import { type StackRouteConfig, getFlowActions } from "../lib/NFXStack";
import type {
  DevtoolsDataStore,
  DevtoolsMessage,
} from "@stackflow/plugin-devtools";
import type { NavFlag } from "../hooks/useNavActions";
import { NAV_FLAG_INTERNAL_FIELD } from "../plugins/navFlagPlugin";
import { scenarioHistoryStore } from "../stores/useScenarioHistoryStore";
import { buildActivityRouteName, scenarioDefinitions } from "../scenarios";
import { createScenarioActivityComponent } from "../runtime/ScenarioActivity";
import { ScenarioRegistryProvider } from "../runtime/ScenarioRegistry";

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

type WorkspaceState =
  | { type: "closed" }
  | { type: "existing"; scenarioId: string }
  | { type: "draft"; scenario: ScenarioBlueprintWithPush };

const createRandomId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const createScenarioDraft = (): ScenarioBlueprintWithPush => {
  const scenarioId = createRandomId("custom-scenario");
  const activityId = createRandomId("activity");
  const activityName = buildActivityRouteName(scenarioId, activityId);
  const initialElementId = createRandomId("text");

  return {
    id: scenarioId,
    title: "새 시나리오",
    description: "시나리오 설명을 입력하세요.",
    flagLabel: "CUSTOM",
    activities: [
      {
        id: activityId,
        activityName,
        activityTitle: "첫 Activity",
        stageName: "Flow Stage",
        elements: [
          {
            id: initialElementId,
            type: "text",
            params: {
              body: "첫 번째 텍스트 블록을 수정해 보세요.",
              tone: "default",
            },
          },
        ],
      },
    ],
  };
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

export const ScenarioApp = () => {
  const devtoolsData = useStackflowDevtoolsData();
  const [actions, setActions] = useState<FlowActions | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(
    null
  );
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    type: "closed",
  });
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

  const handleWorkspaceOpen = useCallback((scenarioId: string) => {
    setWorkspaceState({ type: "existing", scenarioId });
  }, []);

  const handleWorkspaceClose = useCallback(() => {
    setWorkspaceState({ type: "closed" });
  }, []);

  const handleCreateScenario = useCallback(() => {
    setWorkspaceState({ type: "draft", scenario: createScenarioDraft() });
  }, []);

  const workspaceScenario = useMemo(() => {
    if (workspaceState.type === "existing") {
      return (
        scenarioBlueprints.find(
          (scenario) => scenario.id === workspaceState.scenarioId
        ) ?? null
      );
    }

    if (workspaceState.type === "draft") {
      return workspaceState.scenario;
    }

    return null;
  }, [scenarioBlueprints, workspaceState]);

  useEffect(() => {
    if (workspaceState.type !== "existing") {
      return;
    }

    const exists = scenarioBlueprints.some(
      (scenario) => scenario.id === workspaceState.scenarioId
    );

    if (!exists) {
      setWorkspaceState({ type: "closed" });
    }
  }, [scenarioBlueprints, workspaceState]);

  const handleWorkspaceMeta = useCallback(
    (meta: { title: string; description: string }) => {
      if (!workspaceScenario) {
        return;
      }

      if (workspaceState.type === "existing") {
        handleScenarioMetaUpdate(workspaceScenario.id, meta);
        return;
      }

      if (workspaceState.type === "draft") {
        setWorkspaceState((current) =>
          current.type === "draft"
            ? {
                type: "draft",
                scenario: {
                  ...current.scenario,
                  title: meta.title,
                  description: meta.description,
                },
              }
            : current
        );
      }
    },
    [handleScenarioMetaUpdate, workspaceScenario, workspaceState]
  );

  return (
    <ScenarioRegistryProvider scenarios={scenarios}>
      {workspaceState.type !== "closed" && workspaceScenario ? (
        <ScenarioWorkspace
          scenario={workspaceScenario}
          onClose={handleWorkspaceClose}
          onRun={
            workspaceState.type === "existing"
              ? () => handleScenarioRun(workspaceState.scenarioId)
              : () => undefined
          }
          isActionsReady={
            workspaceState.type === "existing" ? Boolean(actions) : false
          }
          isRunning={
            workspaceState.type === "existing" &&
            runningScenarioId === workspaceState.scenarioId
          }
          onUpdateScenarioMeta={handleWorkspaceMeta}
        />
      ) : (
        <div className="app-shell">
          <ScenarioPanel
            scenarios={scenarioSummaries}
            activeScenarioId={activeScenario}
            runningScenarioId={runningScenarioId}
            onRunScenario={handleScenarioRun}
            onOpenScenario={handleWorkspaceOpen}
            onCreateScenario={handleCreateScenario}
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
