import type { ActivityComponentType } from "@stackflow/react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DetailActivityParams } from "../../activities/DetailActivity";
import type { HomeActivityParams } from "../../activities/HomeActivity";
import {
  StackFlagSingleTop,
  STACK_FLAG_INTERNAL_FIELD,
} from "../../plugins/stackFlagPlugin";
import type {
  StackConfigEntry,
  StackName,
  StackRouteConfig,
} from "../../stack/stackConfig";
import type { StackManager, StackManagerConfig } from "../../stack/stackManager";

type UseStackActionsType =
  typeof import("../../hooks/useStackActions").useStackActions;
type UseStackActionsReturn = ReturnType<UseStackActionsType>;
type StackProviderType =
  typeof import("../../contexts/StackContext").StackProvider;
type StackScopeProviderType =
  typeof import("../../contexts/StackContext").StackScopeProvider;
type UseStacksType = typeof import("../../contexts/StackContext").useStacks;
type CfgType = typeof import("../../config/Cfg").Cfg;

const HomeActivityStub: ActivityComponentType<HomeActivityParams> = ({
  params,
}) => <div data-testid="activity-home">{params.highlight ?? "home"}</div>;

const DetailActivityStub: ActivityComponentType<DetailActivityParams> = ({
  params,
}) => <div data-testid="activity-detail">{params.id}</div>;

const OrdersActivityStub: ActivityComponentType = () => (
  <div data-testid="activity-orders">orders</div>
);

const activityRoutes = [
  { name: "home", activity: HomeActivityStub },
  { name: "detail", activity: DetailActivityStub },
  { name: "orders", activity: OrdersActivityStub },
] as const satisfies ReadonlyArray<StackRouteConfig>;

const stackList = [
  {
    name: "home",
    label: "Home",
    initialActivity: "home",
    activities: activityRoutes,
  },
  {
    name: "orders",
    label: "Orders",
    initialActivity: "orders",
    activities: activityRoutes,
  },
] as const satisfies ReadonlyArray<StackConfigEntry>;

const buildStackConfig = (): StackManagerConfig => ({
  initStack: "home",
  stackList,
});

type ActionButtonProps = {
  label: string;
  onClick: (actions: UseStackActionsReturn) => void;
};

const ActionButton = ({ label, onClick }: ActionButtonProps) => {
  if (!useStackActionsRef) {
    throw new Error("useStackActions not initialized");
  }
  const actions = useStackActionsRef();
  return (
    <button type="button" onClick={() => onClick(actions)}>
      {label}
    </button>
  );
};

let providerKey = 0;
let stackManagerRef: StackManager | null = null;
let StackProvider: StackProviderType | null = null;
let StackScopeProvider: StackScopeProviderType | null = null;
let useStacksRef: UseStacksType | null = null;
let useStackActionsRef: UseStackActionsType | null = null;
let CfgRef: CfgType | null = null;

const StackManagerBridge = () => {
  if (!useStacksRef) {
    throw new Error("useStacks not initialized");
  }
  const { stackManager } = useStacksRef();
  stackManagerRef = stackManager;
  return null;
};

const wrapWithProvider = (ui: JSX.Element, scopeStackName?: StackName) => {
  if (!StackProvider || !StackScopeProvider) {
    throw new Error("StackProvider not initialized");
  }

  const Provider = StackProvider;
  const ScopeProvider = StackScopeProvider;

  return (
    <Provider key={providerKey}>
      {scopeStackName ? (
        <ScopeProvider stackName={scopeStackName}>{ui}</ScopeProvider>
      ) : (
        ui
      )}
    </Provider>
  );
};

const renderWithProvider = (ui: JSX.Element, scopeStackName?: StackName) =>
  render(
    wrapWithProvider(
      <>
        <StackManagerBridge />
        {ui}
      </>,
      scopeStackName,
    ),
  );

const waitForStackManager = async () => {
  await waitFor(() => {
    expect(stackManagerRef).not.toBeNull();
  });
  return stackManagerRef!;
};

const waitForActiveStack = async (stackName: StackName) => {
  const stackManager = stackManagerRef ?? (await waitForStackManager());
  await waitFor(() => {
    expect(stackManager.getStackSwitchState().activeStack).toBe(stackName);
  });
};

const warmStack = async (stackName: StackName) => {
  const stackManager = stackManagerRef ?? (await waitForStackManager());
  act(() => {
    stackManager.setActiveStack(stackName);
  });
  await waitForActiveStack(stackName);
};

describe.sequential("useStackActions", () => {
  beforeEach(async () => {
    vi.resetModules();
    const cfgModule = await import("../../config/Cfg");
    const stackContext = await import("../../contexts/StackContext");
    const stackActions = await import("../../hooks/useStackActions");

    CfgRef = cfgModule.Cfg;
    StackProvider = stackContext.StackProvider;
    StackScopeProvider = stackContext.StackScopeProvider;
    useStacksRef = stackContext.useStacks;
    useStackActionsRef = stackActions.useStackActions;

    CfgRef.init({ stack: buildStackConfig() });
    providerKey += 1;
    stackManagerRef = null;
  });

  it("uses stack scope as default target", async () => {
    renderWithProvider(
      <ActionButton
        label="push-detail"
        onClick={({ push }) => push("detail", { params: { id: "100" } })}
      />,
      "orders",
    );

    await waitForStackManager();
    await warmStack("orders");
    await warmStack("home");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-detail" }));
    });

    const stackManager = stackManagerRef ?? CfgRef?.getStack();
    if (!stackManager) {
      throw new Error("Stack manager not initialized");
    }
    expect(stackManager.getStackSwitchState().activeStack).toBe("orders");

    const ordersStack = stackManager.getStack("orders").actions.getStack();
    const ordersTop = ordersStack.activities[ordersStack.activities.length - 1];
    expect(ordersTop?.name).toBe("detail");
    expect(ordersTop?.params.id).toBe("100");

    const homeStack = stackManager.getStack("home").actions.getStack();
    const homeTop = homeStack.activities[homeStack.activities.length - 1];
    expect(homeTop?.name).toBe("home");
  });

  it("push with stack option switches active stack", async () => {
    renderWithProvider(
      <ActionButton
        label="push-orders"
        onClick={({ push }) =>
          push("detail", { stack: "orders", params: { id: "200" } })
        }
      />,
    );

    await waitForStackManager();
    await warmStack("orders");
    await warmStack("home");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-orders" }));
    });

    const stackManager = stackManagerRef ?? CfgRef?.getStack();
    if (!stackManager) {
      throw new Error("Stack manager not initialized");
    }
    expect(stackManager.getStackSwitchState().activeStack).toBe("orders");

    const ordersStack = stackManager.getStack("orders").actions.getStack();
    const ordersTop = ordersStack.activities[ordersStack.activities.length - 1];
    expect(ordersTop?.name).toBe("detail");
    expect(ordersTop?.params.id).toBe("200");
  });

  it("push with flag replaces top activity and sanitizes params", async () => {
    renderWithProvider(
      <>
        <ActionButton
          label="push-first"
          onClick={({ push }) => push("detail", { params: { id: "1" } })}
        />
        <ActionButton
          label="push-single-top"
          onClick={({ push }) =>
            push("detail", {
              params: { id: "2" },
              animate: false,
              flag: new StackFlagSingleTop(),
            })
          }
        />
      </>,
      "home",
    );

    await waitForStackManager();
    await warmStack("home");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-first" }));
    });

    const stackManager = stackManagerRef ?? CfgRef?.getStack();
    if (!stackManager) {
      throw new Error("Stack manager not initialized");
    }
    const initialStack = stackManager.getStack("home").actions.getStack();
    const initialTop =
      initialStack.activities[initialStack.activities.length - 1];
    const initialTopId = initialTop?.id;

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-single-top" }));
    });

    const stack = stackManager.getStack("home").actions.getStack();
    const previousTop = stack.activities.find(
      (activity) => activity.id === initialTopId,
    );
    const top = stack.activities[stack.activities.length - 1];
    const topParams = top?.params as Record<string, unknown> | undefined;

    expect(previousTop?.exitedBy?.name).toBe("Replaced");
    expect(top?.params.id).toBe("2");
    expect(topParams?.[STACK_FLAG_INTERNAL_FIELD]).toBeUndefined();
  });
});
