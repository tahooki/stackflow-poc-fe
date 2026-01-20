import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  createTestStackflow,
  getActiveActivityNames,
} from "./helpers";

describe("multi-stack isolation", () => {
  it("maintains independent histories per stack instance", () => {
    const stackA = createTestStackflow({ initialActivity: "home" });
    const stackB = createTestStackflow({ initialActivity: "orders" });

    act(() => {
      stackA.instance.actions.push("detail", { id: "a-1" });
    });

    expect(getActiveActivityNames(stackA.instance)).toEqual(["home", "detail"]);
    expect(getActiveActivityNames(stackB.instance)).toEqual(["orders"]);

    act(() => {
      stackB.instance.actions.push("snapshot", { id: "b-1" });
    });

    expect(getActiveActivityNames(stackB.instance)).toEqual([
      "orders",
      "snapshot",
    ]);
    expect(getActiveActivityNames(stackA.instance)).toEqual(["home", "detail"]);
  });
});
