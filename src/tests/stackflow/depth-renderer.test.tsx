import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { depthRendererPlugin } from "../../plugins/depthRendererPlugin";
import {
  createTestStackflow,
  getActiveActivities,
  getActiveActivityNames,
} from "./helpers";

describe("depthRenderer plugin", () => {
  it("limits rendered activities to maxVisible", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 3 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
      instance.actions.push("snapshot", { id: "4" });
    });

    expect(getActiveActivities(instance)).toHaveLength(5);
    expect(screen.queryByTestId("activity-home")).toBeNull();
    expect(screen.getByTestId("activity-depth")).toBeInTheDocument();
    expect(screen.getByTestId("activity-orders")).toBeInTheDocument();
    expect(screen.getByTestId("activity-snapshot")).toBeInTheDocument();
  });

  it("resets floorIndex when depth drops under maxVisible", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 3 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
      instance.actions.push("snapshot", { id: "4" });
    });

    expect(screen.queryByTestId("activity-home")).toBeNull();

    act(() => {
      instance.actions.pop(2, { animate: false });
    });

    expect(getActiveActivityNames(instance)).toEqual(["home", "detail", "depth"]);
    expect(screen.getByTestId("activity-home")).toBeInTheDocument();
  });

  it("filters out exit-done activities", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 5 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });

    act(() => {
      instance.actions.pop({ animate: false });
    });

    expect(screen.queryByTestId("activity-detail")).toBeNull();
  });

  it("renders all activities when maxVisible is zero", () => {
    const { instance } = createTestStackflow({
      plugins: [depthRendererPlugin({ maxVisible: 0 })],
    });

    act(() => {
      instance.actions.push("detail", { id: "1" });
      instance.actions.push("depth", { id: "2" });
      instance.actions.push("orders", { id: "3" });
    });

    const rendered = screen.getAllByTestId(/activity-/);
    expect(rendered).toHaveLength(4);
  });
});
