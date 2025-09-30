import { describe, it, expect, beforeEach } from "vitest";
import { scenarioDefinitions } from "./index";
import type { NavFlag } from "../plugins/navFlagPlugin";
import { MockStackActions } from "../test-utils/mockStackActions";
import type { ScenarioElementNavigate } from "../components/ScenarioPanel.types";

/**
 * 시나리오 JSON 데이터를 기반으로 실제 내비게이션 플로우를 검증합니다.
 * 각 시나리오에 정의된 액티비티와 내비게이션 요소들이 올바르게 동작하는지 확인합니다.
 */

describe("Scenario Flow Tests - JSON 기반 검증", () => {
  let mockActions: MockStackActions;

  beforeEach(() => {
    mockActions = new MockStackActions();
  });

  /**
   * 시나리오 네비게이션 시뮬레이션 헬퍼
   */
  const executeNavigation = (
    targetActivityName: string,
    navFlag?: NavFlag,
    params: Record<string, unknown> = {}
  ) => {
    const stack = mockActions.getStack();
    const top = stack.activities[stack.activities.length - 1];

    if (!navFlag) {
      mockActions.push({
        activityName: targetActivityName,
        activityParams: params,
      });
      return;
    }

    const augmentContext = { navFlag };

    const pushActivity = (name: string) => {
      mockActions.push({
        activityName: name,
        activityParams: params,
        activityContext: augmentContext,
      });
    };

    const replaceActivity = (name: string) => {
      mockActions.replace({
        activityName: name,
        activityParams: params,
        activityContext: augmentContext,
      });
    };

    const rewindToActivity = (name: string): boolean => {
      const index = stack.activities.findIndex(
        (activity) => activity.name === name
      );
      if (index < 0) {
        return false;
      }

      for (let i = stack.activities.length - 1; i > index; i -= 1) {
        mockActions.pop();
      }

      replaceActivity(name);
      return true;
    };

    switch (navFlag.flag) {
      case "SINGLE_TOP": {
        if (top?.name === targetActivityName) {
          replaceActivity(targetActivityName);
        } else {
          pushActivity(targetActivityName);
        }
        break;
      }
      case "CLEAR_TOP": {
        if (!rewindToActivity(navFlag.activity)) {
          pushActivity(targetActivityName);
        }
        break;
      }
      case "CLEAR_STACK": {
        const hadAny = stack.activities.length > 0;
        for (let i = stack.activities.length - 1; i >= 0; i -= 1) {
          mockActions.pop();
        }
        if (hadAny) {
          replaceActivity(targetActivityName);
        } else {
          pushActivity(targetActivityName);
        }
        break;
      }
      case "JUMP_TO": {
        pushActivity(navFlag.activity);
        break;
      }
      case "CLEAR_TOP_SINGLE_TOP": {
        if (rewindToActivity(navFlag.activity)) {
          break;
        }
        if (top?.name === targetActivityName) {
          replaceActivity(targetActivityName);
        } else {
          pushActivity(targetActivityName);
        }
        break;
      }
      case "JUMP_TO_CLEAR_TOP": {
        const target = navFlag.activity;
        if (rewindToActivity(target)) {
          break;
        }
        pushActivity(target);
        break;
      }
      default: {
        pushActivity(targetActivityName);
      }
    }
  };

  describe("시나리오 1: stack-basic-flow (스택 기본 흐름)", () => {
    const scenario = scenarioDefinitions.find(
      (s) => s.id === "stack-basic-flow"
    );

    it("시나리오가 정의되어 있다", () => {
      expect(scenario).toBeDefined();
      expect(scenario?.title).toBe("스택 기본 흐름");
      expect(scenario?.activities).toHaveLength(3);
    });

    it("Entry -> Activity A로 시작한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      executeNavigation(scenario.entry.activityName);

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getCurrentActivity()?.name).toBe(
        scenario.entry.activityName
      );
    });

    it("A → B → C 순서로 PUSH한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const activityA = scenario.activities.find((a) => a.id === "activity-a");
      const activityB = scenario.activities.find((a) => a.id === "activity-b");
      const activityC = scenario.activities.find((a) => a.id === "activity-c");

      if (!activityA || !activityB || !activityC) {
        throw new Error("Activities not found");
      }

      // A로 시작
      executeNavigation(activityA.activityName);
      expect(mockActions.getStackNames()).toEqual([activityA.activityName]);

      // A에서 B로 (PUSH)
      executeNavigation(activityB.activityName);
      expect(mockActions.getStackNames()).toEqual([
        activityA.activityName,
        activityB.activityName,
      ]);

      // B에서 C로 (PUSH)
      executeNavigation(activityC.activityName);
      expect(mockActions.getStackNames()).toEqual([
        activityA.activityName,
        activityB.activityName,
        activityC.activityName,
      ]);
    });

    it("C에서 CLEAR_TOP으로 B로 복귀한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const activityA = scenario.activities.find((a) => a.id === "activity-a");
      const activityB = scenario.activities.find((a) => a.id === "activity-b");
      const activityC = scenario.activities.find((a) => a.id === "activity-c");

      if (!activityA || !activityB || !activityC) {
        throw new Error("Activities not found");
      }

      // A → B → C 스택 구성
      executeNavigation(activityA.activityName);
      executeNavigation(activityB.activityName);
      executeNavigation(activityC.activityName);

      // C에서 CLEAR_TOP으로 B 복귀
      const clearTopElement = activityC.elements.find(
        (el) => el.type === "navigate" && el.params.flagBadge === "CLEAR_TOP"
      ) as ScenarioElementNavigate | undefined;

      expect(clearTopElement).toBeDefined();
      expect(clearTopElement?.params.navFlag?.flag).toBe("CLEAR_TOP");

      // navFlag의 activity는 full name으로 변환해야 함
      executeNavigation(activityB.activityName, {
        flag: "CLEAR_TOP",
        activity: activityB.activityName,
      });

      // C가 제거되고 B가 최상단
      expect(mockActions.getStackNames()).toEqual([
        activityA.activityName,
        activityB.activityName,
      ]);
      expect(mockActions.getStackDepth()).toBe(2);
    });

    it("CLEAR_STACK으로 A로 초기화한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const activityA = scenario.activities.find((a) => a.id === "activity-a");
      const activityB = scenario.activities.find((a) => a.id === "activity-b");
      const activityC = scenario.activities.find((a) => a.id === "activity-c");

      if (!activityA || !activityB || !activityC) {
        throw new Error("Activities not found");
      }

      // A → B → C 스택 구성
      executeNavigation(activityA.activityName);
      executeNavigation(activityB.activityName);
      executeNavigation(activityC.activityName);

      // CLEAR_STACK
      executeNavigation(activityA.activityName, { flag: "CLEAR_STACK" });

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual([activityA.activityName]);
    });
  });

  describe("시나리오 2: jump-to-flow (JUMP_TO 이동)", () => {
    const scenario = scenarioDefinitions.find((s) => s.id === "jump-to-flow");

    it("시나리오가 정의되어 있다", () => {
      expect(scenario).toBeDefined();
      expect(scenario?.title).toBe("JUMP_TO 이동");
      expect(scenario?.flagLabel).toBe("JUMP_TO");
    });

    it("JUMP_TO는 targetActivityId를 무시하고 navFlag.activity로 이동한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const entryA = scenario.activities.find((a) => a.id === "entry-a");
      const activityC = scenario.activities.find((a) => a.id === "activity-c");

      if (!entryA || !activityC) {
        throw new Error("Activities not found");
      }

      // Entry A로 시작
      executeNavigation(entryA.activityName);

      // JUMP_TO로 C로 이동 (targetActivityId는 B이지만 무시됨)
      const jumpToElement = entryA.elements.find(
        (el) => el.type === "navigate" && el.params.flagBadge === "JUMP_TO"
      ) as ScenarioElementNavigate | undefined;

      expect(jumpToElement).toBeDefined();
      expect(jumpToElement?.params.navFlag?.flag).toBe("JUMP_TO");
      expect(jumpToElement?.params.navFlag).toHaveProperty("activity");

      // JUMP_TO는 navFlag.activity로 이동하므로 full name으로 변환
      const activityB = scenario.activities.find((a) => a.id === "activity-b");
      executeNavigation(activityB?.activityName ?? "", {
        flag: "JUMP_TO",
        activity: activityC.activityName,
      });

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getCurrentActivity()?.name).toBe(
        activityC.activityName
      );
    });
  });

  describe("시나리오 3: clear-top-single-top-flow (CLEAR_TOP_SINGLE_TOP 조합)", () => {
    const scenario = scenarioDefinitions.find(
      (s) => s.id === "clear-top-single-top-flow"
    );

    it("시나리오가 정의되어 있다", () => {
      expect(scenario).toBeDefined();
      expect(scenario?.title).toBe("CLEAR_TOP + SINGLE_TOP 조합");
      expect(scenario?.flagLabel).toBe("CLEAR_TOP_SINGLE_TOP");
    });

    it("대상이 스택에 있으면 CLEAR_TOP처럼 동작한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const stageA = scenario.activities.find((a) => a.id === "stage-a");
      const stageB = scenario.activities.find((a) => a.id === "stage-b");
      const stageC = scenario.activities.find((a) => a.id === "stage-c");

      if (!stageA || !stageB || !stageC) {
        throw new Error("Activities not found");
      }

      // A → B → C 스택 구성
      executeNavigation(stageA.activityName);
      executeNavigation(stageB.activityName);
      executeNavigation(stageC.activityName);

      // C에서 CLEAR_TOP_SINGLE_TOP으로 B 복귀
      executeNavigation(stageB.activityName, {
        flag: "CLEAR_TOP_SINGLE_TOP",
        activity: stageB.activityName,
      });

      expect(mockActions.getStackNames()).toEqual([
        stageA.activityName,
        stageB.activityName,
      ]);
      expect(mockActions.getStackDepth()).toBe(2);
    });

    it("대상이 스택에 없고 최상단과 동일하면 SINGLE_TOP처럼 재진입한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const stageA = scenario.activities.find((a) => a.id === "stage-a");
      const stageB = scenario.activities.find((a) => a.id === "stage-b");

      if (!stageA || !stageB) {
        throw new Error("Activities not found");
      }

      // B로 시작
      executeNavigation(stageB.activityName);

      // CLEAR_TOP_SINGLE_TOP으로 B 재진입 (스택에 없는 activity를 지정)
      executeNavigation(stageB.activityName, {
        flag: "CLEAR_TOP_SINGLE_TOP",
        activity: "non-existent-activity",
      });

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual([stageB.activityName]);
    });
  });

  describe("시나리오 4: jump-to-clear-top-flow (JUMP_TO_CLEAR_TOP 이동)", () => {
    const scenario = scenarioDefinitions.find(
      (s) => s.id === "jump-to-clear-top-flow"
    );

    it("시나리오가 정의되어 있다", () => {
      expect(scenario).toBeDefined();
      expect(scenario?.title).toBe("JUMP_TO_CLEAR_TOP 이동");
      expect(scenario?.flagLabel).toBe("JUMP_TO_CLEAR_TOP");
    });

    it("대상이 스택에 있으면 되감고 재진입한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const startA = scenario.activities.find((a) => a.id === "start-a");
      const startB = scenario.activities.find((a) => a.id === "start-b");
      const startD = scenario.activities.find((a) => a.id === "start-d");

      if (!startA || !startB || !startD) {
        throw new Error("Activities not found");
      }

      // A → B → D 스택 구성
      executeNavigation(startA.activityName);
      executeNavigation(startB.activityName);
      executeNavigation(startD.activityName);

      // D에서 JUMP_TO_CLEAR_TOP으로 B 복귀
      executeNavigation(startB.activityName, {
        flag: "JUMP_TO_CLEAR_TOP",
        activity: startB.activityName,
      });

      expect(mockActions.getStackNames()).toEqual([
        startA.activityName,
        startB.activityName,
      ]);
      expect(mockActions.getStackDepth()).toBe(2);
    });

    it("대상이 스택에 없으면 새로 push한다", () => {
      if (!scenario) throw new Error("Scenario not found");

      const startA = scenario.activities.find((a) => a.id === "start-a");
      const startE = scenario.activities.find((a) => a.id === "start-e");

      if (!startA || !startE) {
        throw new Error("Activities not found");
      }

      // A로 시작
      executeNavigation(startA.activityName);

      // JUMP_TO_CLEAR_TOP으로 E 이동 (스택에 없음)
      executeNavigation(startE.activityName, {
        flag: "JUMP_TO_CLEAR_TOP",
        activity: startE.activityName,
      });

      expect(mockActions.getStackNames()).toEqual([
        startA.activityName,
        startE.activityName,
      ]);
      expect(mockActions.getStackDepth()).toBe(2);
    });
  });

  describe("전체 시나리오 메타 검증", () => {
    it("모든 시나리오가 로드되어 있다", () => {
      expect(scenarioDefinitions).toHaveLength(4);
    });

    it("각 시나리오는 entry와 activities를 가지고 있다", () => {
      scenarioDefinitions.forEach((scenario) => {
        expect(scenario.entry).toBeDefined();
        expect(scenario.entry.activityId).toBeTruthy();
        expect(scenario.entry.activityName).toBeTruthy();
        expect(scenario.activities.length).toBeGreaterThan(0);
      });
    });

    it("각 액티비티는 고유한 activityName을 가지고 있다", () => {
      scenarioDefinitions.forEach((scenario) => {
        const activityNames = scenario.activities.map((a) => a.activityName);
        const uniqueNames = new Set(activityNames);
        expect(activityNames.length).toBe(uniqueNames.size);
      });
    });

    it("navigate 타입 요소들은 올바른 navFlag 구조를 가지고 있다", () => {
      scenarioDefinitions.forEach((scenario) => {
        scenario.activities.forEach((activity) => {
          activity.elements.forEach((element) => {
            if (element.type === "navigate") {
              const navElement = element as ScenarioElementNavigate;

              // flagBadge가 있으면 navFlag도 있어야 함
              if (
                navElement.params.flagBadge &&
                navElement.params.flagBadge !== "PUSH"
              ) {
                expect(navElement.params.navFlag).toBeDefined();
                expect(navElement.params.navFlag?.flag).toBe(
                  navElement.params.flagBadge
                );
              }
            }
          });
        });
      });
    });
  });
});
