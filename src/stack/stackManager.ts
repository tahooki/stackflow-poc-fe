import { createStackflowInstance, type StackInstance } from "../lib/stack/createStackflowInstance";
import type {
  ActivityName,
  DepthRendererConfig,
  StackConfigEntry,
  StackName,
  StackRouteConfig,
} from "./stackConfig";

export type StackManagerConfig = {
  initStack: StackName;
  stackList: ReadonlyArray<StackConfigEntry>;
  depthRenderer?: DepthRendererConfig;
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
  private readonly stackConfigByName: Record<StackName, StackConfigEntry>;
  private switchState: StackSwitchState;
  private switchSubscribers = new Set<StackSwitchSubscriber>();

  constructor(config: StackManagerConfig) {
    this.config = config;
    this.stackConfigByName = config.stackList.reduce(
      (acc, entry) => {
        acc[entry.name] = entry;
        return acc;
      },
      {} as Record<StackName, StackConfigEntry>
    );
    this._stackList = this.createStacks();
    this.switchState = {
      activeStack: config.initStack,
      stackHistory: [],
      lastStackUpdateAt: null,
    };
  }

  getStackNames(): StackName[] {
    return this.config.stackList.map((entry) => entry.name);
  }

  getStack(stackName: StackName): StackInstance {
    return this._stackList[stackName];
  }

  getStackConfig(stackName: StackName): StackConfigEntry {
    return this.stackConfigByName[stackName];
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
    return this.config.stackList.reduce((acc, stackConfig) => {
      const maxVisible =
        this.config.depthRenderer?.stackOverrides?.[stackConfig.name] ??
        this.config.depthRenderer?.maxVisible;
      acc[stackConfig.name] = createStackflowInstance({
        stackName: stackConfig.name,
        initialActivity: stackConfig.initialActivity,
        routes: stackConfig.activities,
        depthRenderer: maxVisible ? { maxVisible } : undefined,
      });
      return acc;
    }, {} as Record<StackName, StackInstance>);
  }

  private emitStackSwitch() {
    this.switchSubscribers.forEach((subscriber) => subscriber());
  }
}
