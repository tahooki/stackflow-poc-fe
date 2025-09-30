/**
 * 테스트용 Stackflow Actions Mock
 * 실제 Stackflow 스택 동작을 시뮬레이션합니다.
 */

export type MockActivity = {
  id: string;
  name: string;
  params: Record<string, unknown>;
  context?: Record<string, unknown>;
};

export type MockStackState = {
  activities: MockActivity[];
};

export class MockStackActions {
  private stack: MockActivity[] = [];
  private activityIdCounter = 0;
  private isPreventDefault = false;
  private overriddenParams: unknown = null;

  getStack(): MockStackState {
    return { activities: [...this.stack] };
  }

  push(options: {
    activityId?: string;
    activityName: string;
    activityParams?: Record<string, unknown>;
    activityContext?: Record<string, unknown>;
    skipEnterActiveState?: boolean;
  }): void {
    const id = options.activityId ?? `activity-${++this.activityIdCounter}`;
    this.stack.push({
      id,
      name: options.activityName,
      params: options.activityParams ?? {},
      context: options.activityContext,
    });
  }

  pop(): void {
    this.stack.pop();
  }

  replace(options: {
    activityId?: string;
    activityName: string;
    activityParams?: Record<string, unknown>;
    activityContext?: Record<string, unknown>;
    skipEnterActiveState?: boolean;
  }): void {
    if (this.stack.length > 0) {
      this.stack.pop();
    }
    this.push(options);
  }

  preventDefault(): void {
    this.isPreventDefault = true;
  }

  overrideActionParams(params: unknown): void {
    this.overriddenParams = params;
  }

  // Test helpers
  wasPreventDefaultCalled(): boolean {
    return this.isPreventDefault;
  }

  getOverriddenParams(): unknown {
    return this.overriddenParams;
  }

  reset(): void {
    this.stack = [];
    this.activityIdCounter = 0;
    this.isPreventDefault = false;
    this.overriddenParams = null;
  }

  getStackNames(): string[] {
    return this.stack.map((a) => a.name);
  }

  getCurrentActivity(): MockActivity | undefined {
    return this.stack[this.stack.length - 1];
  }

  getStackDepth(): number {
    return this.stack.length;
  }
}
