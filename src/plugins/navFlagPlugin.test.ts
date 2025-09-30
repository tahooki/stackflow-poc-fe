import { describe, it, expect, beforeEach } from "vitest";
import type { NavFlag } from "./navFlagPlugin";
import { NAV_FLAG_INTERNAL_FIELD } from "./navFlagPlugin";
import { MockStackActions } from "../test-utils/mockStackActions";

/**
 * navFlagPlugin의 핵심 로직을 테스트합니다.
 * 실제 플러그인 훅을 직접 호출하는 대신, 로직을 재현하여 검증합니다.
 */

describe("NavFlag Plugin - Flag Pattern Tests", () => {
  let mockActions: MockStackActions;

  beforeEach(() => {
    mockActions = new MockStackActions();
  });

  /**
   * 플러그인의 handleBeforePush 로직을 시뮬레이션하는 헬퍼 함수
   */
  const simulatePush = (
    activityName: string,
    activityParams: Record<string, unknown> = {},
    navFlag?: NavFlag
  ) => {
    const params = navFlag
      ? { ...activityParams, [NAV_FLAG_INTERNAL_FIELD]: navFlag }
      : activityParams;

    const stack = mockActions.getStack();
    const top = stack.activities[stack.activities.length - 1];

    // navFlag가 없으면 기본 push
    if (!navFlag) {
      mockActions.push({
        activityName,
        activityParams: params,
      });
      return;
    }

    // navFlag가 있으면 플러그인 로직 실행
    const sanitizedParams = { ...params };
    delete sanitizedParams[NAV_FLAG_INTERNAL_FIELD];

    const augmentContext = { navFlag };

    const pushActivity = (name: string) => {
      mockActions.push({
        activityName: name,
        activityParams: sanitizedParams,
        activityContext: augmentContext,
      });
    };

    const replaceActivity = (name: string) => {
      mockActions.replace({
        activityName: name,
        activityParams: sanitizedParams,
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
        if (top?.name === activityName) {
          replaceActivity(activityName);
        } else {
          pushActivity(activityName);
        }
        break;
      }
      case "CLEAR_TOP": {
        if (!rewindToActivity(navFlag.activity)) {
          pushActivity(activityName);
        }
        break;
      }
      case "CLEAR_STACK": {
        const hadAny = stack.activities.length > 0;
        for (let i = stack.activities.length - 1; i >= 0; i -= 1) {
          mockActions.pop();
        }
        if (hadAny) {
          replaceActivity(activityName);
        } else {
          pushActivity(activityName);
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
        if (top?.name === activityName) {
          replaceActivity(activityName);
        } else {
          pushActivity(activityName);
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
        pushActivity(activityName);
      }
    }
  };

  describe("PUSH (기본 동작)", () => {
    it("navFlag 없이 push하면 스택에 추가된다", () => {
      simulatePush("activity-a");
      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual(["activity-a"]);
    });

    it("여러 번 push하면 스택이 쌓인다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-c");
      expect(mockActions.getStackDepth()).toBe(3);
      expect(mockActions.getStackNames()).toEqual([
        "activity-a",
        "activity-b",
        "activity-c",
      ]);
    });
  });

  describe("SINGLE_TOP", () => {
    it("현재 최상단이 아닌 경우 새로 push한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b", {}, { flag: "SINGLE_TOP" });

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
    });

    it("현재 최상단과 동일한 경우 replace로 재진입한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-b", {}, { flag: "SINGLE_TOP" });

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
      expect(mockActions.getCurrentActivity()?.context?.navFlag).toEqual({
        flag: "SINGLE_TOP",
      });
    });
  });

  describe("CLEAR_TOP", () => {
    it("대상이 스택에 있으면 그 위의 액티비티들을 제거하고 replace로 재진입한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-c");
      simulatePush("activity-d");

      // activity-b로 CLEAR_TOP하면 c, d가 제거되고 b가 replace됨
      simulatePush(
        "activity-b",
        {},
        { flag: "CLEAR_TOP", activity: "activity-b" }
      );

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
    });

    it("대상이 스택에 없으면 새로 push한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");

      // activity-x는 스택에 없으므로 새로 push
      simulatePush(
        "activity-x",
        {},
        { flag: "CLEAR_TOP", activity: "activity-x" }
      );

      expect(mockActions.getStackDepth()).toBe(3);
      expect(mockActions.getStackNames()).toEqual([
        "activity-a",
        "activity-b",
        "activity-x",
      ]);
    });
  });

  describe("CLEAR_STACK", () => {
    it("스택을 모두 비우고 새 액티비티로 replace한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-c");

      simulatePush("activity-home", {}, { flag: "CLEAR_STACK" });

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual(["activity-home"]);
    });

    it("빈 스택에서 CLEAR_STACK을 호출하면 push로 진입한다", () => {
      simulatePush("activity-home", {}, { flag: "CLEAR_STACK" });

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual(["activity-home"]);
    });
  });

  describe("JUMP_TO", () => {
    it("targetActivityId와 무관하게 지정된 activity로 이동한다", () => {
      simulatePush("activity-a");

      // targetActivityId는 b이지만 navFlag.activity가 c이므로 c로 이동
      simulatePush(
        "activity-b",
        {},
        { flag: "JUMP_TO", activity: "activity-c" }
      );

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-c"]);
    });

    it("JUMP_TO는 항상 새로운 액티비티를 push한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");

      simulatePush(
        "activity-x",
        {},
        { flag: "JUMP_TO", activity: "activity-a" }
      );

      expect(mockActions.getStackDepth()).toBe(3);
      expect(mockActions.getStackNames()).toEqual([
        "activity-a",
        "activity-b",
        "activity-a",
      ]);
    });
  });

  describe("CLEAR_TOP_SINGLE_TOP", () => {
    it("대상이 스택에 있으면 CLEAR_TOP처럼 동작한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-c");

      simulatePush(
        "activity-b",
        {},
        { flag: "CLEAR_TOP_SINGLE_TOP", activity: "activity-b" }
      );

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
    });

    it("대상이 스택에 없고 최상단과 동일하면 replace로 재진입한다", () => {
      simulatePush("activity-a");

      simulatePush(
        "activity-a",
        {},
        { flag: "CLEAR_TOP_SINGLE_TOP", activity: "activity-x" }
      );

      expect(mockActions.getStackDepth()).toBe(1);
      expect(mockActions.getStackNames()).toEqual(["activity-a"]);
    });

    it("대상이 스택에 없고 최상단과 다르면 새로 push한다", () => {
      simulatePush("activity-a");

      simulatePush(
        "activity-b",
        {},
        { flag: "CLEAR_TOP_SINGLE_TOP", activity: "activity-x" }
      );

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
    });
  });

  describe("JUMP_TO_CLEAR_TOP", () => {
    it("대상이 스택에 있으면 되감고 replace로 재진입한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");
      simulatePush("activity-c");
      simulatePush("activity-d");

      simulatePush(
        "activity-x",
        {},
        { flag: "JUMP_TO_CLEAR_TOP", activity: "activity-b" }
      );

      expect(mockActions.getStackDepth()).toBe(2);
      expect(mockActions.getStackNames()).toEqual(["activity-a", "activity-b"]);
    });

    it("대상이 스택에 없으면 새로 push한다", () => {
      simulatePush("activity-a");
      simulatePush("activity-b");

      simulatePush(
        "activity-x",
        {},
        { flag: "JUMP_TO_CLEAR_TOP", activity: "activity-e" }
      );

      expect(mockActions.getStackDepth()).toBe(3);
      expect(mockActions.getStackNames()).toEqual([
        "activity-a",
        "activity-b",
        "activity-e",
      ]);
    });
  });
});
