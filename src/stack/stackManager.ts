import { createStackflowInstance, type StackInstance } from "../lib/stack/createStackflowInstance";
import type { ActivityName, ActivityRegistry, StackName } from "./stackConfig";
import { stackManagerConfig } from "./stackConfig";

export type StackManagerConfig = {
  initStack: StackName;
  stackList: Record<StackName, { label: string; initialActivity: ActivityName }>;
  routes: ReadonlyArray<{
    name: ActivityName;
    activity: ActivityRegistry[ActivityName];
  }>;
};

export class StackManager {
  public readonly config: StackManagerConfig;
  public readonly _stackList: Record<StackName, StackInstance>;

  constructor(config: StackManagerConfig) {
    this.config = config;
    this._stackList = this.createStacks();
  }

  getStackNames(): StackName[] {
    return Object.keys(this.config.stackList) as StackName[];
  }

  getStack(stackName: StackName): StackInstance {
    return this._stackList[stackName];
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
}

export const stackManager = new StackManager(
  stackManagerConfig satisfies StackManagerConfig
);
