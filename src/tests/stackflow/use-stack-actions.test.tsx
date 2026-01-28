import type { ActivityComponentType } from "@stackflow/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Cfg } from "../../config/Cfg";
import {
  StackProvider,
  StackScopeProvider,
  useStacks,
} from "../../contexts/StackContext";
import type { DetailActivityParams } from "../../activities/DetailActivity";
import type { HomeActivityParams } from "../../activities/HomeActivity";
import { useStackActions } from "../../hooks/useStackActions";
import {
  StackFlagSingleTop,
  STACK_FLAG_INTERNAL_FIELD,
} from "../../plugins/stackFlagPlugin";
import type {
  StackConfigEntry,
  StackName,
  StackRouteConfig,
} from "../../stack/stackConfig";
import type { StackManagerConfig } from "../../stack/stackManager";

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
  onClick: (actions: ReturnType<typeof useStackActions>) => void;
};

const ActionButton = ({ label, onClick }: ActionButtonProps) => {
  const actions = useStackActions();
  return (
    <button type="button" onClick={() => onClick(actions)}>
      {label}
    </button>
  );
};

const StackReadyGate = ({
  stackName = "home",
  children,
}: {
  stackName?: StackName;
  children: ReactNode;
}) => {
  const { activeStack } = useStacks();
  const [ready, setReady] = useState(() => activeStack === stackName);

  useEffect(() => {
    if (activeStack === stackName) {
      setReady(true);
    }
  }, [activeStack, stackName]);

  return ready ? <>{children}</> : null;
};

let providerKey = 0;

const wrapWithProvider = (ui: JSX.Element, scopeStackName?: StackName) => (
  <StackProvider key={providerKey}>
    {scopeStackName ? (
      <StackScopeProvider stackName={scopeStackName}>{ui}</StackScopeProvider>
    ) : (
      ui
    )}
  </StackProvider>
);

const renderWithProvider = (ui: JSX.Element, scopeStackName?: StackName) =>
  render(wrapWithProvider(ui, scopeStackName));

const waitForActiveStack = async (stackName: StackName) => {
  await waitFor(() => {
    const viewport = document.querySelector(".stack-viewport");
    expect(viewport?.getAttribute("data-active-stack")).toBe(stackName);
  });
};

const warmStack = async (stackName: StackName) => {
  const stackManager = Cfg.getStack();
  act(() => {
    stackManager.setActiveStack(stackName);
  });
  await waitForActiveStack(stackName);
};

describe.sequential("useStackActions", () => {
  beforeEach(() => {
    Cfg.init({ stack: buildStackConfig() });
    providerKey += 1;
  });

  it("uses stack scope as default target", async () => {
    renderWithProvider(
      <StackReadyGate stackName="orders">
        <ActionButton
          label="push-detail"
          onClick={({ push }) => push("detail", { params: { id: "100" } })}
        />
      </StackReadyGate>,
      "orders",
    );

    await warmStack("orders");
    await warmStack("home");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-detail" }));
    });

    const stackManager = Cfg.getStack();
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
      <StackReadyGate stackName="home">
        <ActionButton
          label="push-orders"
          onClick={({ push }) =>
            push("detail", { stack: "orders", params: { id: "200" } })
          }
        />
      </StackReadyGate>,
    );

    await warmStack("orders");
    await warmStack("home");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-orders" }));
    });

    const stackManager = Cfg.getStack();
    expect(stackManager.getStackSwitchState().activeStack).toBe("orders");

    const ordersStack = stackManager.getStack("orders").actions.getStack();
    const ordersTop = ordersStack.activities[ordersStack.activities.length - 1];
    expect(ordersTop?.name).toBe("detail");
    expect(ordersTop?.params.id).toBe("200");
  });

  it("push with flag replaces top activity and sanitizes params", async () => {
    renderWithProvider(
      <StackReadyGate stackName="home">
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
        </>
      </StackReadyGate>,
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "push-first" }));
    });

    const stackManager = Cfg.getStack();
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
