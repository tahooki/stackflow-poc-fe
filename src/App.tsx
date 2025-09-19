import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import DetailActivity from "./activities/DetailActivity";
import HomeActivity from "./activities/HomeActivity";
import ModalActivity from "./activities/ModalActivity";
import StressActivity from "./activities/StressActivity";
import {
  NFXStack,
  type StackRouteConfig,
  getFlowActions,
} from "./lib/NFXStack";
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

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

type ResizableViewportProps = {
  width: number;
  height: number;
  onResize: (size: { width: number; height: number }) => void;
  children: ReactNode;
};

const ResizableViewport = ({
  width,
  height,
  onResize,
  children,
}: ResizableViewportProps) => {
  const dragStateRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (handle: ResizeHandle) => (event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current = {
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: width,
        startHeight: height,
      };
    },
    [width, height]
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      let nextWidth = dragState.startWidth;
      let nextHeight = dragState.startHeight;

      if (dragState.handle.includes("e")) {
        nextWidth = dragState.startWidth + deltaX;
      }
      if (dragState.handle.includes("w")) {
        nextWidth = dragState.startWidth - deltaX;
      }
      if (dragState.handle.includes("s")) {
        nextHeight = dragState.startHeight + deltaY;
      }
      if (dragState.handle.includes("n")) {
        nextHeight = dragState.startHeight - deltaY;
      }

      onResize({
        width: clamp(nextWidth, MIN_VIEWPORT.width, MAX_VIEWPORT.width),
        height: clamp(nextHeight, MIN_VIEWPORT.height, MAX_VIEWPORT.height),
      });
    };

    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onResize]);

  return (
    <div
      className="viewport-frame"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="viewport-content">{children}</div>
      {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as ResizeHandle[]).map(
        (handle) => (
          <button
            key={handle}
            type="button"
            className={`viewport-handle viewport-handle--${handle}`}
            onPointerDown={handlePointerDown(handle)}
            aria-label={`Resize ${handle}`}
          />
        )
      )}
    </div>
  );
};

type StackActivity = DevtoolsDataStore["stack"]["activities"][number];

type StackEntry = {
  activity: StackActivity;
  depth: number;
  status: "enter" | "idle" | "exit";
};

const STACK_ANIMATION_MS = 320;

const DevtoolsStackPanel = ({ data }: { data: DevtoolsDataStore | null }) => {
  const activities = useMemo(
    () =>
      (data?.stack.activities ?? []).filter(
        (activity) => activity.exitedBy === undefined
      ),
    [data]
  );
  const [entries, setEntries] = useState<StackEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const orderMap = new Map(
      activities.map((activity, index) => [activity.id, index])
    );

    setEntries((prev) => {
      const next: StackEntry[] = [];
      const retained = new Set<string>();

      prev.forEach((entry) => {
        const nextIndex = orderMap.get(entry.activity.id);
        if (typeof nextIndex === "number") {
          retained.add(entry.activity.id);
          next.push({
            activity: activities[nextIndex],
            depth: nextIndex + 1,
            status: entry.status === "exit" ? "exit" : "idle",
          });
        } else if (entry.status !== "exit") {
          next.push({ ...entry, status: "exit" });
        } else {
          next.push(entry);
        }
      });

      activities.forEach((activity, index) => {
        if (retained.has(activity.id)) {
          return;
        }

        next.push({
          activity,
          depth: index + 1,
          status: "enter",
        });
      });

      return next.sort(
        (a, b) =>
          (a.depth ?? Number.MAX_SAFE_INTEGER) -
          (b.depth ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [activities]);

  useEffect(() => {
    const timers: number[] = [];

    entries.forEach((entry) => {
      if (entry.status === "enter") {
        timers.push(
          window.setTimeout(() => {
            setEntries((state) =>
              state.map((item) =>
                item.activity.id === entry.activity.id &&
                item.status === "enter"
                  ? { ...item, status: "idle" }
                  : item
              )
            );
          }, STACK_ANIMATION_MS)
        );
      }

      if (entry.status === "exit") {
        timers.push(
          window.setTimeout(() => {
            setEntries((state) =>
              state.filter((item) => item.activity.id !== entry.activity.id)
            );
          }, STACK_ANIMATION_MS)
        );
      }
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [entries]);

  useEffect(() => {
    const activeEntries = entries.filter((entry) => entry.status !== "exit");

    if (activeEntries.length === 0) {
      setSelectedId(null);
      return;
    }

    setSelectedId((prev) => {
      if (prev && activeEntries.some((entry) => entry.activity.id === prev)) {
        return prev;
      }

      return activeEntries[activeEntries.length - 1].activity.id;
    });
  }, [entries]);

  const sortedEntries = useMemo(
    () => entries.slice().sort((a, b) => a.depth - b.depth),
    [entries]
  );
  const activeSelected = sortedEntries.find(
    (entry) => entry.activity.id === selectedId && entry.status !== "exit"
  );
  const liveDepth = entries.filter((entry) => entry.status !== "exit").length;

  return (
    <div className="panel stack-panel">
      <header className="panel__header">
        <h2>Stackflow Devtools</h2>
        <span className="panel__meta">Depth {liveDepth}</span>
      </header>
      <div className="stack-panel__list">
        {sortedEntries.map((entry) => {
          const { activity, depth, status } = entry;
          const isActive = activity.id === selectedId && status !== "exit";
          return (
            <button
              key={activity.id}
              type="button"
              className={[
                "stack-panel__item",
                `stack-panel__item--${status}`,
                isActive ? "stack-panel__item--active" : null,
                status === "exit" ? "stack-panel__item--inactive" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => status !== "exit" && setSelectedId(activity.id)}
              disabled={status === "exit"}
            >
              <span className="stack-panel__item-depth">{depth}</span>
              <div className="stack-panel__item-body">
                <strong>{activity.name}</strong>
                <span className="stack-panel__item-meta">
                  {activity.transitionState}
                </span>
                <span className="stack-panel__item-id">{activity.id}</span>
              </div>
            </button>
          );
        })}
        {sortedEntries.length === 0 && (
          <div className="stack-panel__empty">Stack is empty.</div>
        )}
      </div>

      {activeSelected ? (
        <div className="stack-panel__detail">
          <h3>{activeSelected.activity.name}</h3>
          <section>
            <h4>Params</h4>
            <pre>
              {JSON.stringify(activeSelected.activity.params ?? {}, null, 2)}
            </pre>
          </section>
          {activeSelected.activity.enteredBy.activityContext && (
            <section>
              <h4>Options</h4>
              <pre>
                {JSON.stringify(
                  activeSelected.activity.enteredBy.activityContext,
                  null,
                  2
                )}
              </pre>
            </section>
          )}
          <section>
            <h4>Entered</h4>
            <pre>
              {JSON.stringify(activeSelected.activity.enteredBy, null, 2)}
            </pre>
          </section>
        </div>
      ) : (
        <div className="stack-panel__detail stack-panel__detail--empty">
          Select an activity to inspect params.
        </div>
      )}
    </div>
  );
};

const App = () => {
  const devtoolsData = useStackflowDevtoolsData();
  const [viewportSize, setViewportSize] = useState(DEFAULT_VIEWPORT);
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

  const handleScenario = useCallback(
    (scenario: Scenario) => {
      if (!actions) {
        return;
      }

      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];

      scenario.run(actions, { queue: queueTimeout });
      setActiveScenario(scenario.id);
    },
    [actions, queueTimeout]
  );

  return (
    <div className="app-shell">
      <section className="panel scenario-panel">
        <header className="panel__header">
          <h2>시나리오 보드</h2>
          <span className="panel__meta">
            NAV 플래그 케이스와 상태 유지 흐름을 빠르게 실행합니다.
          </span>
        </header>
        <ul className="scenario-list">
          {scenarios.map((scenario) => (
            <li
              key={scenario.id}
              className={
                activeScenario === scenario.id
                  ? "scenario-card scenario-card--active"
                  : "scenario-card"
              }
            >
              <div>
                <span className="scenario-card__flag">
                  {scenario.flagLabel}
                </span>
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
                onClick={() => handleScenario(scenario)}
                disabled={!actions}
              >
                실행
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="viewport-panel panel">
        <header className="panel__header">
          <h2>스택 플레이그라운드</h2>
          <span className="panel__meta">
            width/height를 직접 입력하거나 핸들을 잡아 리사이즈하세요.
          </span>
        </header>
        <div className="viewport-toolbar">
          <label>
            W
            <input
              type="number"
              min={MIN_VIEWPORT.width}
              max={MAX_VIEWPORT.width}
              value={Math.round(viewportSize.width)}
              onChange={(event) =>
                setViewportSize((prev) => ({
                  ...prev,
                  width: clamp(
                    Number(event.target.value),
                    MIN_VIEWPORT.width,
                    MAX_VIEWPORT.width
                  ),
                }))
              }
            />
          </label>
          <label>
            H
            <input
              type="number"
              min={MIN_VIEWPORT.height}
              max={MAX_VIEWPORT.height}
              value={Math.round(viewportSize.height)}
              onChange={(event) =>
                setViewportSize((prev) => ({
                  ...prev,
                  height: clamp(
                    Number(event.target.value),
                    MIN_VIEWPORT.height,
                    MAX_VIEWPORT.height
                  ),
                }))
              }
            />
          </label>
          <button
            type="button"
            className="viewport-toolbar__reset"
            onClick={() => setViewportSize(DEFAULT_VIEWPORT)}
          >
            Reset
          </button>
        </div>

        <div className="viewport-stage">
          <ResizableViewport
            width={viewportSize.width}
            height={viewportSize.height}
            onResize={setViewportSize}
          >
            <div className="stack-host">
              <NFXStack routes={stackRoutes} />
            </div>
          </ResizableViewport>
        </div>
      </section>

      <DevtoolsStackPanel data={devtoolsData} />
    </div>
  );
};

export default App;
