import { act, screen } from "@testing-library/react";
import type { ActivityComponentType } from "@stackflow/react";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { describe, expect, it } from "vitest";

import { createTestStackflow } from "./helpers";

type ScrollParams = Record<string, string | undefined>;

const ScrollHome: ActivityComponentType<ScrollParams> = () => (
  <div data-testid="scroll-home" style={{ height: "120px", overflow: "auto" }}>
    <div style={{ height: "1200px" }} />
  </div>
);

const ScrollDetail: ActivityComponentType<ScrollParams> = () => (
  <div
    data-testid="scroll-detail"
    style={{ height: "120px", overflow: "auto" }}
  >
    <div style={{ height: "1200px" }} />
  </div>
);

describe("scroll retention", () => {
  it("keeps scroll position when returning to previous activity", () => {
    const { instance } = createTestStackflow({
      activities: {
        home: ScrollHome,
        detail: ScrollDetail,
      },
      plugins: [basicRendererPlugin()],
    });

    const scrollHome = screen.getByTestId("scroll-home");
    scrollHome.scrollTop = 200;

    act(() => {
      instance.actions.push("detail", { id: "1" });
    });
    act(() => {
      instance.actions.pop({ animate: false });
    });

    expect(screen.getByTestId("scroll-home").scrollTop).toBe(200);
  });
});
