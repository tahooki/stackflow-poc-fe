import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StackInstance } from "../../lib/stack/createStackflowInstance";
import { createStackflowInstance } from "../../lib/stack/createStackflowInstance";
import type {
  StackConfigEntry,
  StackName,
  StackRouteConfig,
} from "../../stack/stackConfig";
import { StackManager, type StackManagerConfig } from "../../stack/stackManager";

vi.mock("../../lib/stack/createStackflowInstance", () => ({
  createStackflowInstance: vi.fn(),
}));

const activityRoutes = [
  { name: "home", activity: () => null },
  { name: "orders", activity: () => null },
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

const buildConfig = (
  overrides?: Partial<StackManagerConfig>
): StackManagerConfig => ({
  initStack: "home",
  stackList,
  ...overrides,
});

const makeStubStack = (stackName: StackName): StackInstance =>
  ({
    Stack: () => null,
    actions: {
      getStack: () => ({ activities: [] }),
    },
    stackName,
  }) as unknown as StackInstance;

const createStackflowInstanceMock = vi.mocked(createStackflowInstance);

const setupManager = (overrides?: Partial<StackManagerConfig>) => {
  const stubByName = new Map<StackName, StackInstance>();

  createStackflowInstanceMock.mockImplementation(({ stackName }) => {
    const stub = makeStubStack(stackName);
    stubByName.set(stackName, stub);
    return stub;
  });

  const manager = new StackManager(buildConfig(overrides));
  return { manager, stubByName };
};

describe("StackManager", () => {
  beforeEach(() => {
    createStackflowInstanceMock.mockReset();
  });

  it("builds stacks and exposes config entries", () => {
    const { manager, stubByName } = setupManager();

    expect(createStackflowInstanceMock).toHaveBeenCalledTimes(2);
    expect(manager.getStackNames()).toEqual(["home", "orders"]);
    expect(manager.getStack("home")).toBe(stubByName.get("home"));
    expect(manager.getStack("orders")).toBe(stubByName.get("orders"));
    expect(manager.getStackConfig("orders").label).toBe("Orders");
  });

  it("applies depthRenderer overrides when creating stacks", () => {
    setupManager({
      depthRenderer: {
        maxVisible: 5,
        stackOverrides: {
          orders: 2,
        },
      },
    });

    const homeCall = createStackflowInstanceMock.mock.calls.find(
      ([args]) => args.stackName === "home"
    );
    const ordersCall = createStackflowInstanceMock.mock.calls.find(
      ([args]) => args.stackName === "orders"
    );

    expect(homeCall?.[0].depthRenderer).toEqual({ maxVisible: 5 });
    expect(ordersCall?.[0].depthRenderer).toEqual({ maxVisible: 2 });
  });

  it("tracks active stack changes and notifies subscribers", () => {
    const { manager } = setupManager();
    const subscriber = vi.fn();
    const unsubscribe = manager.subscribeStackSwitch(subscriber);

    manager.setActiveStack("orders");

    const state = manager.getStackSwitchState();
    expect(state.activeStack).toBe("orders");
    expect(state.stackHistory).toEqual(["home"]);
    expect(state.lastStackUpdateAt).not.toBeNull();
    expect(subscriber).toHaveBeenCalledTimes(1);

    manager.setActiveStack("orders");
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
    manager.setActiveStack("home");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("honors recordHistory false and pops history", () => {
    const { manager } = setupManager();

    manager.setActiveStack("orders", { recordHistory: false });
    expect(manager.getStackSwitchState().stackHistory).toEqual([]);

    manager.setActiveStack("home", { recordHistory: false });
    expect(manager.getStackSwitchState().stackHistory).toEqual([]);

    manager.setActiveStack("orders");
    manager.setActiveStack("home");

    expect(manager.getStackSwitchState().stackHistory).toEqual([
      "home",
      "orders",
    ]);

    const firstPop = manager.popStackHistory();
    expect(firstPop).toBe("orders");
    expect(manager.getStackSwitchState().activeStack).toBe("orders");
    expect(manager.getStackSwitchState().stackHistory).toEqual(["home"]);

    const secondPop = manager.popStackHistory();
    expect(secondPop).toBe("home");
    expect(manager.getStackSwitchState().activeStack).toBe("home");
    expect(manager.getStackSwitchState().stackHistory).toEqual([]);

    expect(manager.popStackHistory()).toBeNull();
  });

  it("resets to init stack and clears history", () => {
    const { manager } = setupManager();

    manager.setActiveStack("orders");
    expect(manager.getStackSwitchState().stackHistory).toEqual(["home"]);

    const reset = manager.resetToInitStack();
    expect(reset).toBe("home");
    expect(manager.getStackSwitchState().activeStack).toBe("home");
    expect(manager.getStackSwitchState().stackHistory).toEqual([]);
    expect(manager.resetToInitStack()).toBeNull();
  });
});
