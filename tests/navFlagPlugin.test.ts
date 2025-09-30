import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { stackflow } from "@stackflow/react";

import {
  NAV_FLAG_INTERNAL_FIELD,
  navFlagPlugin,
  type NavFlag,
} from "../src/plugins/navFlagPlugin.js";

const createTestStack = () =>
  stackflow({
    transitionDuration: 1,
    activities: {
      Home: () => null,
      Profile: () => null,
      Settings: () => null,
      Inbox: () => null,
    },
    plugins: [navFlagPlugin()],
  });

type StackInstance = ReturnType<typeof createTestStack>;
type FlowActions = StackInstance["actions"];
type ActivityName = Parameters<FlowActions["push"]>[0];
type ActivityParams = Parameters<FlowActions["push"]>[1];

type StackActivitySnapshot = ReturnType<FlowActions["getStack"]>["activities"][number];

let actions: FlowActions;
const globalWithWindow = globalThis as { window?: unknown };
const originalWindow =
  Object.prototype.hasOwnProperty.call(globalWithWindow, "window")
    ? globalWithWindow.window
    : undefined;

const readActiveActivities = () =>
  actions
    .getStack()
    .activities.filter((activity) => activity.exitedBy == null);

const readStackNames = () =>
  readActiveActivities().map((activity) => activity.name);

const settleStack = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
};

const extractActivityId = (activity: StackActivitySnapshot) => {
  if (!activity) {
    return undefined;
  }
  if ("activityId" in activity && activity.activityId) {
    return activity.activityId;
  }
  if ("id" in activity && typeof activity.id === "string") {
    return activity.id;
  }
  return undefined;
};

const pushActivity = async (
  name: ActivityName,
  navFlag?: NavFlag,
  baseParams: ActivityParams = {} as ActivityParams,
) => {
  const payload = (navFlag
    ? ({
        ...(baseParams ? (baseParams as Record<string, unknown>) : {}),
        [NAV_FLAG_INTERNAL_FIELD]: navFlag,
      } as ActivityParams)
    : baseParams) ?? ({} as ActivityParams);

  await actions.push(name, payload);
  await settleStack();
};

describe("navFlagPlugin stack behavior", () => {
  beforeEach(() => {
    if (typeof globalWithWindow.window === "undefined") {
      globalWithWindow.window = {};
    }

    const stack = createTestStack();
    renderToString(createElement(stack.Stack));
    actions = stack.actions;
  });

  afterEach(() => {
    if (typeof originalWindow === "undefined") {
      delete globalWithWindow.window;
    } else {
      globalWithWindow.window = originalWindow;
    }
  });

  it("pushes new activities onto the stack and pops the top activity", async () => {
    await pushActivity("Home");
    await pushActivity("Profile");

    assert.deepStrictEqual(readStackNames(), ["Home", "Profile"]);

    actions.pop();
    await settleStack();

    assert.deepStrictEqual(readStackNames(), ["Home"]);
  });

  it("replaces the top activity when SINGLE_TOP is requested for the same route", async () => {
    await pushActivity("Home");
    const initialActivities = readActiveActivities();
    const initialTop = initialActivities[initialActivities.length - 1];
    const initialId = extractActivityId(initialTop);

    await pushActivity("Home", { flag: "SINGLE_TOP" });

    const currentActivities = readActiveActivities();
    assert.strictEqual(currentActivities.length, 1);
    const currentTop = currentActivities[0];
    assert(currentTop);
    assert.strictEqual(currentTop.name, "Home");
    const currentId = extractActivityId(currentTop);

    if (initialId && currentId) {
      assert.notStrictEqual(currentId, initialId);
    }

    const params = (currentTop.params ?? {}) as Record<string, unknown>;
    assert.ok(!(NAV_FLAG_INTERNAL_FIELD in params));
  });

  it("rewinds the stack to the target when CLEAR_TOP is used", async () => {
    await pushActivity("Home");
    await pushActivity("Profile");

    await pushActivity("Settings", { flag: "CLEAR_TOP", activity: "Home" });

    assert.deepStrictEqual(readStackNames(), ["Home"]);
  });

  it("clears the entire stack when CLEAR_STACK is used", async () => {
    await pushActivity("Home");
    await pushActivity("Profile");

    await pushActivity("Inbox", { flag: "CLEAR_STACK" });

    assert.deepStrictEqual(readStackNames(), ["Inbox"]);
  });

  it("jumps directly to the requested activity when JUMP_TO is used", async () => {
    await pushActivity("Home");

    await pushActivity("Settings", { flag: "JUMP_TO", activity: "Profile" });

    assert.deepStrictEqual(readStackNames(), ["Home", "Profile"]);
  });

  it("pushes the requested activity when CLEAR_TOP target is missing", async () => {
    await pushActivity("Home");

    await pushActivity("Settings", { flag: "CLEAR_TOP", activity: "Missing" });

    assert.deepStrictEqual(readStackNames(), ["Home", "Settings"]);
  });
});
