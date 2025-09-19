import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DetailActivity from "./activities/DetailActivity";
import HomeActivity from "./activities/HomeActivity";
import ModalActivity from "./activities/ModalActivity";
import StressActivity from "./activities/StressActivity";
import {
  ScenarioPanel,
  type ScenarioCard,
} from "./components/ScenarioPanel";
import { StackDevtoolsPanel } from "./components/StackDevtoolsPanel";
import { StackViewportPanel } from "./components/StackViewportPanel";
import { type StackRouteConfig, getFlowActions } from "./lib/NFXStack";
import type {
  DevtoolsDataStore,
  DevtoolsMessage,
} from "@stackflow/plugin-devtools";
import type { NavFlag } from "./hooks/useNavActions";
import { NAV_FLAG_INTERNAL_FIELD } from "./plugins/navFlagPlugin";

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

type FlowActions = NonNullable<ReturnType<typeof getFlowActions>>;

type Scenario = {
  id: string;
  title: string;
  description: string;
  steps: string[];
  flagLabel: string;
  run: (
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

  const scenarios: Scenario[] = useMemo(
    () => [
      {
        id: "baseline-detail",
        title: "기본 상세 진입",
        description:
          "피드에서 새 상세 화면을 푸시하고 애니메이션/스크롤 초기화를 확인합니다.",
        steps: ["Home → Detail", "뒤로가기로 복귀 시 스크롤 유지 확인"],
        flagLabel: "DEFAULT",
        run: (flowActions) => {
          pushWithFlag(flowActions, "detail", { id: `${Date.now()}` });
        },
      },
      {
        id: "clear-top",
        title: "CLEAR_TOP 재노출",
        description:
          "이미 스택에 있는 Detail 42를 맨 위로 끌어올려 상태가 유지되는지 확인합니다.",
        steps: ["Detail 42 push", "CLEAR_TOP으로 재진입"],
        flagLabel: "CLEAR_TOP",
        run: (flowActions) => {
          pushWithFlag(
            flowActions,
            "detail",
            { id: "42" },
            {
              flag: "CLEAR_TOP",
              activity: "detail",
            }
          );
        },
      },
      {
        id: "single-top",
        title: "SINGLE_TOP 갱신",
        description:
          "현재 최상단이 동일한 Detail이면 replace, 아니면 push 되는지 확인합니다.",
        steps: ["Detail 99 push", "같은 요청 반복"],
        flagLabel: "SINGLE_TOP",
        run: (flowActions) => {
          pushWithFlag(
            flowActions,
            "detail",
            { id: "99", title: "SingleTop" },
            {
              flag: "SINGLE_TOP",
            }
          );
        },
      },
      {
        id: "heavy-scroll",
        title: "스크롤 유지 + CLEAR_TOP",
        description:
          "Stress 화면에서 깊게 스크롤한 후 Detail을 CLEAR_TOP으로 호출해 스크롤 보존을 확인합니다.",
        steps: ["Stress push", "Detail CLEAR_TOP", "뒤로가기로 scroll 확인"],
        flagLabel: "CLEAR_TOP",
        run: (flowActions, helpers) => {
          pushWithFlag(flowActions, "stress", { size: "420" });
          helpers.queue(() => {
            pushWithFlag(
              flowActions,
              "detail",
              { id: "scroll-check", title: "Scroll retention" },
              {
                flag: "CLEAR_TOP",
                activity: "detail",
              }
            );
          }, 300);
        },
      },
      {
        id: "modal-cycle",
        title: "모달 열고 닫기",
        description:
          "모달 액티비티를 push하여 overlay 상태가 스택과 함께 관리되는지 확인합니다.",
        steps: ["Modal push", "모달 닫기", "스택 복귀"],
        flagLabel: "MODAL",
        run: (flowActions) => {
          pushWithFlag(
            flowActions,
            "modal",
            {
              source: "Scenario Panel",
              message: "Closing should pop only the overlay layer.",
            },
            undefined,
            { animate: true }
          );
        },
      },
      {
        id: "clear-stack",
        title: "CLEAR_STACK 홈 복귀",
        description:
          "여러 화면을 쌓은 뒤 CLEAR_STACK으로 홈으로 돌아가며 히스토리 싱크를 확인합니다.",
        steps: ["Detail push", "CLEAR_STACK"],
        flagLabel: "CLEAR_STACK",
        run: (flowActions, helpers) => {
          pushWithFlag(flowActions, "detail", { id: "temp" });
          helpers.queue(() => {
            pushWithFlag(
              flowActions,
              "home",
              { highlight: "Returned via CLEAR_STACK" },
              {
                flag: "CLEAR_STACK",
              }
            );
          }, 200);
        },
      },
    ],
    [queueTimeout]
  );

  const scenarioCards: ScenarioCard[] = useMemo(
    () =>
      scenarios.map(({ id, title, description, steps, flagLabel }) => ({
        id,
        title,
        description,
        steps,
        flagLabel,
      })),
    [scenarios]
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

      scenario.run(actions, { queue: queueTimeout });
      setActiveScenario(scenario.id);
    },
    [actions, queueTimeout, scenarios]
  );

  return (
    <div className="app-shell">
      <ScenarioPanel
        scenarios={scenarioCards}
        activeScenarioId={activeScenario}
        onRunScenario={handleScenarioRun}
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
