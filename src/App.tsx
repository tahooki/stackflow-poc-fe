import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DetailActivity from "./activities/DetailActivity";
import HomeActivity from "./activities/HomeActivity";
import ModalActivity from "./activities/ModalActivity";
import StressActivity from "./activities/StressActivity";
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

const stackRoutes: StackRouteConfig[] = [
  {
    name: "home",
    activity: HomeActivity,
    route: "/",
    initial: true,
  },
  {
    name: "detail",
    activity: DetailActivity,
    route: {
      path: "/detail/:id",
    },
  },
  {
    name: "stress",
    activity: StressActivity,
    route: {
      path: "/stress",
    },
  },
  {
    name: "modal",
    activity: ModalActivity,
    route: {
      path: "/modal",
    },
  },
];

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

const FLOW_STAGE_LABEL = "Flow Stage";

type FlowActions = NonNullable<ReturnType<typeof getFlowActions>>;

type ScenarioBlueprintWithPush = ScenarioBlueprint<
  Parameters<FlowActions["push"]>[0],
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
  const stack = actions.getStack();
  if (stack.activities.length > 0) {
    actions.pop(stack.activities.length, { animate: false });
  }

  const entryParams = entry.params ?? ({} as Parameters<FlowActions["push"]>[1]);

  pushWithFlag(actions, entry.activityName, entryParams, undefined, {
    animate: false,
  });
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
  const [workspaceScenarioId, setWorkspaceScenarioId] = useState<
    string | null
  >(null);
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
    () => [
      {
        id: "baseline-detail",
        title: "기본 상세 진입",
        description:
          "피드에서 새 상세 화면을 푸시하고 애니메이션/스크롤 초기화를 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "DEFAULT",
        stages: [
          {
            id: "baseline-detail-home",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "HomeActivity",
            elements: [
              {
                id: "baseline-detail-home-intro",
                type: "text",
                params: {
                  body: "피드 상단에서 사용자가 상세 화면으로 진입하는 가장 단순한 경로입니다.",
                },
              },
              {
                id: "baseline-detail-home-push",
                type: "navigate",
                params: {
                  label: "Detail push",
                  activityName: "detail",
                  params: { id: "dynamic-detail-id" },
                  flagBadge: "DEFAULT",
                },
              },
              {
                id: "baseline-detail-home-note",
                type: "text",
                params: {
                  body: "새로 푸시되는 화면은 초기 스크롤로 전환됩니다.",
                  tone: "muted",
                },
              },
            ],
          },
          {
            id: "baseline-detail-detail",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "baseline-detail-detail-text",
                type: "text",
                params: {
                  body: "DetailActivity는 초기 진입 시 컨텐츠를 페이드 인하고 스크롤을 상단으로 맞춥니다.",
                },
              },
              {
                id: "baseline-detail-detail-retention",
                type: "text",
                params: {
                  body: "뒤로가기로 복귀하면 이전 스크롤 위치가 유지되어야 합니다.",
                  tone: "muted",
                },
              },
            ],
          },
        ],
      },
      {
        id: "clear-top",
        title: "CLEAR_TOP 재노출",
        description:
          "이미 스택에 있는 Detail 42를 맨 위로 끌어올려 상태가 유지되는지 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "CLEAR_TOP",
        stages: [
          {
            id: "clear-top-existing-detail",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "clear-top-existing-detail-text",
                type: "text",
                params: {
                  body: "스택 하단에는 이미 id 42를 가진 DetailActivity가 존재한다고 가정합니다.",
                },
              },
              {
                id: "clear-top-existing-detail-nav",
                type: "navigate",
                params: {
                  label: "Bring Detail 42 to top",
                  activityName: "detail",
                  params: { id: "42" },
                  navFlag: {
                    flag: "CLEAR_TOP",
                    activity: "detail",
                  },
                  flagBadge: "CLEAR_TOP",
                },
              },
            ],
          },
          {
            id: "clear-top-resurfaced",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "clear-top-resurfaced-text",
                type: "text",
                params: {
                  body: "스택 최상단으로 올라온 DetailActivity는 기존 상태(스크롤, 폼 입력 등)를 그대로 유지해야 합니다.",
                },
              },
              {
                id: "clear-top-resurfaced-note",
                type: "text",
                params: {
                  body: "CLEAR_TOP 이동 후에도 동일한 인스턴스를 재사용합니다.",
                  tone: "muted",
                },
              },
            ],
          },
        ],
      },
      {
        id: "single-top",
        title: "SINGLE_TOP 갱신",
        description:
          "현재 최상단이 동일한 Detail이면 replace, 아니면 push 되는지 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "SINGLE_TOP",
        stages: [
          {
            id: "single-top-entry",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "single-top-entry-text",
                type: "text",
                params: {
                  body: "DetailActivity(id:99)를 요청하여 현재 스택 최상단으로 올립니다.",
                },
              },
              {
                id: "single-top-entry-nav",
                type: "navigate",
                params: {
                  label: "Push Detail 99",
                  activityName: "detail",
                  params: { id: "99", title: "SingleTop" },
                  navFlag: {
                    flag: "SINGLE_TOP",
                  },
                  flagBadge: "SINGLE_TOP",
                },
              },
            ],
          },
          {
            id: "single-top-repeat",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "single-top-repeat-text",
                type: "text",
                params: {
                  body: "동일한 요청이 반복되면 기존 화면을 replace하여 애니메이션 없이 내용을 갱신합니다.",
                },
              },
              {
                id: "single-top-repeat-note",
                type: "text",
                params: {
                  body: "최상단이 다른 Activity라면 새로 push됩니다.",
                  tone: "muted",
                },
              },
            ],
          },
        ],
      },
      {
        id: "heavy-scroll",
        title: "스크롤 유지 + CLEAR_TOP",
        description:
          "Stress 화면에서 깊게 스크롤한 후 Detail을 CLEAR_TOP으로 호출해 스크롤 보존을 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "CLEAR_TOP",
        stages: [
          {
            id: "heavy-scroll-home",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "HomeActivity",
            elements: [
              {
                id: "heavy-scroll-home-text",
                type: "text",
                params: {
                  body: "실험용 StressActivity를 호출해 무거운 리스트를 로드합니다.",
                },
              },
              {
                id: "heavy-scroll-home-nav",
                type: "navigate",
                params: {
                  label: "Push StressActivity",
                  activityName: "stress",
                  params: { size: "420" },
                  flagBadge: "DEFAULT",
                },
              },
            ],
          },
          {
            id: "heavy-scroll-stress",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "StressActivity",
            elements: [
              {
                id: "heavy-scroll-stress-text",
                type: "text",
                params: {
                  body: "가상으로 긴 콘텐츠를 스크롤해 스택 깊이와 성능을 측정합니다.",
                },
              },
              {
                id: "heavy-scroll-stress-note",
                type: "text",
                params: {
                  body: "스크롤 위치를 보존한 채 DetailActivity로 이동합니다.",
                  tone: "muted",
                },
              },
              {
                id: "heavy-scroll-stress-nav",
                type: "navigate",
                params: {
                  label: "Detail CLEAR_TOP",
                  activityName: "detail",
                  params: { id: "scroll-check", title: "Scroll retention" },
                  navFlag: {
                    flag: "CLEAR_TOP",
                    activity: "detail",
                  },
                  flagBadge: "CLEAR_TOP",
                },
              },
            ],
          },
          {
            id: "heavy-scroll-detail",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "heavy-scroll-detail-text",
                type: "text",
                params: {
                  body: "StressActivity로 돌아갈 때 스크롤 위치가 원복되는지 확인합니다.",
                },
              },
            ],
          },
        ],
      },
      {
        id: "modal-cycle",
        title: "모달 열고 닫기",
        description:
          "모달 액티비티를 push하여 overlay 상태가 스택과 함께 관리되는지 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "MODAL",
        stages: [
          {
            id: "modal-cycle-home",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "HomeActivity",
            elements: [
              {
                id: "modal-cycle-home-text",
                type: "text",
                params: {
                  body: "홈에서 모달을 호출하여 overlay 스택 동작을 확인합니다.",
                },
              },
              {
                id: "modal-cycle-home-nav",
                type: "navigate",
                params: {
                  label: "Push Modal",
                  activityName: "modal",
                  params: {
                    source: "Scenario Panel",
                    message: "Closing should pop only the overlay layer.",
                  },
                  flagBadge: "MODAL",
                  options: { animate: true },
                },
              },
            ],
          },
          {
            id: "modal-cycle-overlay",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "ModalActivity",
            elements: [
              {
                id: "modal-cycle-overlay-ui",
                type: "modal",
                params: {
                  label: "ModalOverlay",
                  description:
                    "push()로 열린 ModalActivity는 dismiss 시 스택 최상단만 제거합니다.",
                },
              },
              {
                id: "modal-cycle-overlay-note",
                type: "text",
                params: {
                  body: "히스토리를 보존하면서 배경 Activity로 돌아가야 합니다.",
                  tone: "muted",
                },
              },
            ],
          },
          {
            id: "modal-cycle-bottom-sheet",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "BottomSheetPrototype",
            elements: [
              {
                id: "modal-cycle-bottom-sheet-element",
                type: "bottomSheet",
                params: {
                  label: "BottomSheet Preview",
                  description:
                    "Stackflow의 overlay 레이어를 활용해 바텀시트를 실험적으로 붙일 예정입니다.",
                },
              },
              {
                id: "modal-cycle-bottom-sheet-note",
                type: "text",
                params: {
                  body: "UI 구성 요소만 선반영되어 있으며, 실제 push 로직은 후속 작업에서 연결됩니다.",
                  tone: "muted",
                },
              },
            ],
          },
        ],
      },
      {
        id: "clear-stack",
        title: "CLEAR_STACK 홈 복귀",
        description:
          "여러 화면을 쌓은 뒤 CLEAR_STACK으로 홈으로 돌아가며 히스토리 싱크를 확인합니다.",
        entry: {
          activityName: "home",
        },
        flagLabel: "CLEAR_STACK",
        stages: [
          {
            id: "clear-stack-prep",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "DetailActivity",
            elements: [
              {
                id: "clear-stack-prep-text",
                type: "text",
                params: {
                  body: "중간 화면을 임시로 쌓아 둔 뒤 CLEAR_STACK으로 홈을 복구합니다.",
                },
              },
              {
                id: "clear-stack-prep-nav",
                type: "navigate",
                params: {
                  label: "Push Temp Detail",
                  activityName: "detail",
                  params: { id: "temp" },
                  flagBadge: "DEFAULT",
                },
              },
            ],
          },
          {
            id: "clear-stack-reset",
            stageName: FLOW_STAGE_LABEL,
            activityTitle: "HomeActivity",
            elements: [
              {
                id: "clear-stack-reset-nav",
                type: "navigate",
                params: {
                  label: "CLEAR_STACK to Home",
                  activityName: "home",
                  params: { highlight: "Returned via CLEAR_STACK" },
                  navFlag: {
                    flag: "CLEAR_STACK",
                  },
                  flagBadge: "CLEAR_STACK",
                },
              },
              {
                id: "clear-stack-reset-note",
                type: "text",
                params: {
                  body: "모든 히스토리를 정리하고 홈 단일 스택으로 돌아갑니다.",
                  tone: "muted",
                },
              },
            ],
          },
        ],
      },
    ],
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

  const handleScenarioMetaUpdate = useCallback(
    (scenarioId: string, meta: { title: string; description: string }) => {
      setScenarioMetaOverrides((prev) => {
        const base = baseScenarios.find((scenario) => scenario.id === scenarioId);
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

      const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
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

  if (workspaceScenario) {
    return (
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
    );
  }

  return (
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
  );
};

export default App;
