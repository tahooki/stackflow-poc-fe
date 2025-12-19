import { createStackflowInstance, type StackInstance } from "../lib/stack/createStackflowInstance";
import type { ActivityName, ActivityRegistry, StackName } from "./stackConfig";

export type StackManagerConfig = {
  initStack: StackName;
  stackList: Record<StackName, { label: string; initialActivity: ActivityName }>;
  routes: ReadonlyArray<{
    name: ActivityName;
    activity: ActivityRegistry[ActivityName];
  }>;
};

export type StackSwitchState = {
  activeStack: StackName;
  stackHistory: StackName[];
  lastStackUpdateAt: number | null;
};

type StackSwitchSubscriber = () => void;

export class StackManager {
  public readonly config: StackManagerConfig;
  public readonly _stackList: Record<StackName, StackInstance>;
  private switchState: StackSwitchState;
  private switchSubscribers = new Set<StackSwitchSubscriber>();

  constructor(config: StackManagerConfig) {
    this.config = config;
    this._stackList = this.createStacks();
    this.switchState = {
      activeStack: config.initStack,
      stackHistory: [],
      lastStackUpdateAt: null,
    };
  }

  getStackNames(): StackName[] {
    return Object.keys(this.config.stackList) as StackName[];
  }

  getStack(stackName: StackName): StackInstance {
    return this._stackList[stackName];
  }

  subscribeStackSwitch(subscriber: StackSwitchSubscriber) {
    this.switchSubscribers.add(subscriber);
    return () => {
      this.switchSubscribers.delete(subscriber);
    };
  }

  getStackSwitchState(): StackSwitchState {
    return this.switchState;
  }

  setActiveStack(nextStack: StackName, options?: { recordHistory?: boolean }) {
    if (!nextStack || nextStack === this.switchState.activeStack) {
      return;
    }

    const recordHistory = options?.recordHistory !== false;
    const nextHistory = recordHistory
      ? [...this.switchState.stackHistory, this.switchState.activeStack]
      : this.switchState.stackHistory;

    this.switchState = {
      activeStack: nextStack,
      stackHistory: nextHistory,
      lastStackUpdateAt: Date.now(),
    };

    this.emitStackSwitch();
  }

  popStackHistory(): StackName | null {
    const historyCount = this.switchState.stackHistory.length;
    if (historyCount === 0) {
      return null;
    }

    const nextStack = this.switchState.stackHistory[historyCount - 1]!;
    this.switchState = {
      activeStack: nextStack,
      stackHistory: this.switchState.stackHistory.slice(0, -1),
      lastStackUpdateAt: Date.now(),
    };
    this.emitStackSwitch();
    return nextStack;
  }

  resetToInitStack(): StackName | null {
    if (this.switchState.activeStack === this.config.initStack) {
      return null;
    }

    this.switchState = {
      activeStack: this.config.initStack,
      stackHistory: [],
      lastStackUpdateAt: Date.now(),
    };
    this.emitStackSwitch();
    return this.config.initStack;
  }

  private createStacks(): Record<StackName, StackInstance> {
    const routes = this.config.routes.map((route) => ({
      name: route.name,
      activity: route.activity,
    }));

    return this.getStackNames().reduce(
      (acc, stackName) => {
        acc[stackName] = createStackflowInstance({
          stackName,
          initialActivity: this.config.stackList[stackName].initialActivity,
          routes,
        });
        return acc;
      },
      {} as Record<StackName, StackInstance>
    );
  }

  private emitStackSwitch() {
    this.switchSubscribers.forEach((subscriber) => subscriber());
  }
}
